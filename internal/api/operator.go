package api

import (
	"context"
	"errors"
	"fmt"
	"github.com/altinity/altinity-dashboard/internal/utils"
	chopv1 "github.com/altinity/clickhouse-operator/pkg/apis/clickhouse.altinity.com/v1"
	"github.com/emicklei/go-restful/v3"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	errors2 "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"log"
	"net/http"
	"strings"
	"time"
)

// OperatorResource is the REST layer to Pods
type OperatorResource struct {
	opDeployTemplate string
	chopRelease      string
}

// OperatorPutParams is the object for parameters to an operator PUT request
type OperatorPutParams struct {
	Version string `json:"version" description:"version of clickhouse-operator to deploy"`
}

// Name returns the name of the web service
func (o *OperatorResource) Name() string {
	return "Operators"
}

// WebService creates a new service that can handle REST requests
func (o *OperatorResource) WebService(wsi *WebServiceInfo) (*restful.WebService, error) {
	o.chopRelease = wsi.ChopRelease
	err := utils.ReadFilesToStrings(wsi.Embed, []utils.FileToString{
		{Filename: "embed/clickhouse-operator-install-template.yaml", Dest: &o.opDeployTemplate},
	})
	if err != nil {
		return nil, err
	}

	ws := new(restful.WebService)
	ws.
		Path("/api/v1/operators").
		Consumes(restful.MIME_JSON).
		Produces(restful.MIME_JSON)

	ws.Route(ws.GET("").To(o.handleGetOps).
		Doc("get all operators").
		Writes([]Operator{}).
		Returns(200, "OK", []Operator{}))

	ws.Route(ws.PUT("/{namespace}").To(o.handlePutOp).
		Doc("deploy or update an operator").
		Param(ws.PathParameter("namespace", "namespace to deploy to").DataType("string")).
		Reads(OperatorPutParams{}).
		Returns(200, "OK", Operator{}))

	ws.Route(ws.DELETE("/{namespace}").To(o.handleDeleteOp).
		Doc("delete an operator").
		Param(ws.PathParameter("namespace", "namespace to delete from").DataType("string")).
		Returns(200, "OK", nil))

	return ws, nil
}

func (o *OperatorResource) getOperatorPodsFromDeployment(namespace string, deployment appsv1.Deployment) ([]OperatorPod, error) {
	pods, err := getK8sPodsFromLabelSelector(namespace, deployment.Spec.Selector)
	if err != nil {
		return nil, err
	}
	list := make([]OperatorPod, 0, len(pods.Items))
	for _, pod := range pods.Items {
		l := pod.Labels
		ver, ok := l["version"]
		if !ok {
			ver, ok = l["clickhouse.altinity.com/chop"]
			if !ok {
				ver = "unknown"
			}
		}
		list = append(list, OperatorPod{
			Pod: Pod{
				Name:       pod.Name,
				Status:     string(pod.Status.Phase),
				Containers: getContainersFromPod(pod),
			},
			Version: ver,
		})
	}
	return list, nil
}

func (o *OperatorResource) getOperators(namespace string) ([]Operator, error) {
	k := utils.GetK8s()
	defer func() { k.ReleaseK8s() }()
	deployments, err := k.Clientset.AppsV1().Deployments(namespace).List(
		context.TODO(), metav1.ListOptions{
			LabelSelector: "app=clickhouse-operator",
		})
	if err != nil {
		return nil, err
	}
	list := make([]Operator, 0, len(deployments.Items))
	for _, deployment := range deployments.Items {
		conds := deployment.Status.Conditions
		condStrs := make([]string, 0, len(conds))
		for _, cond := range conds {
			if cond.Status == corev1.ConditionTrue {
				condStrs = append(condStrs, string(cond.Type))
			}
		}
		var condStr string
		if len(condStrs) > 0 {
			condStr = strings.Join(condStrs, ", ")
		} else {
			condStr = "Unavailable"
		}
		l := deployment.Labels
		ver, ok := l["version"]
		if !ok {
			ver, ok = l["clickhouse.altinity.com/chop"]
			if !ok {
				ver = "unknown"
			}
		}
		var pods []OperatorPod
		pods, err = o.getOperatorPodsFromDeployment(deployment.Namespace, deployment)
		if err != nil {
			return nil, err
		}
		list = append(list, Operator{
			Name:       deployment.Name,
			Namespace:  deployment.Namespace,
			Conditions: condStr,
			Version:    ver,
			Pods:       pods,
		})
	}
	return list, nil
}

func (o *OperatorResource) handleGetOps(_ *restful.Request, response *restful.Response) {
	ops, err := o.getOperators("")
	if err != nil {
		webError(response, http.StatusInternalServerError, err)
		return
	}
	_ = response.WriteEntity(ops)
}

// processTemplate replaces all instances of ${VAR} in a string with the map value
func processTemplate(template string, vars map[string]string) string {
	for k, v := range vars {
		template = strings.ReplaceAll(template, "${"+k+"}", v)
	}
	return template
}

var ErrStillHaveCHIs = errors.New("cannot delete the last clickhouse-operator while CHI resources still exist")

// deployOrDeleteOperator deploys or deletes a clickhouse-operator
func (o *OperatorResource) deployOrDeleteOperator(namespace string, version string, doDelete bool) error {
	if version == "" {
		version = o.chopRelease
	}
	deploy := processTemplate(o.opDeployTemplate, map[string]string{
		"OPERATOR_IMAGE":             fmt.Sprintf("altinity/clickhouse-operator:%s", version),
		"METRICS_EXPORTER_IMAGE":     fmt.Sprintf("altinity/metrics-exporter:%s", version),
		"OPERATOR_NAMESPACE":         namespace,
		"METRICS_EXPORTER_NAMESPACE": namespace,
	})

	// Get existing operators
	k := utils.GetK8s()
	defer func() { k.ReleaseK8s() }()
	var ops []Operator
	ops, err := o.getOperators("")
	if err != nil {
		return err
	}

	if doDelete {
		if len(ops) == 1 && ops[0].Namespace == namespace {
			// Before deleting the last operator, make sure there won't be orphaned CHIs
			var chis *chopv1.ClickHouseInstallationList
			chis, err = k.ChopClientset.ClickhouseV1().ClickHouseInstallations("").List(
				context.TODO(), metav1.ListOptions{})
			if err != nil {
				var se *errors2.StatusError
				if !errors.As(err, &se) || se.ErrStatus.Reason != metav1.StatusReasonNotFound ||
					se.ErrStatus.Details.Group != "clickhouse.altinity.com" {
					return err
				}
			}
			if len(chis.Items) > 0 {
				return ErrStillHaveCHIs
			}
			// Delete cluster-wide resources (ie, CRDs) if we're really deleting the last operator
			namespace = ""
		}
		err = k.MultiYamlDelete(deploy, namespace)
		if err != nil {
			return err
		}
	} else {
		isUpgrade := false
		for _, op := range ops {
			if op.Namespace == namespace {
				isUpgrade = true
			}
		}
		if isUpgrade {
			err = k.MultiYamlApplySelectively(deploy, namespace,
				func(candidates []*unstructured.Unstructured) []*unstructured.Unstructured {
					selected := make([]*unstructured.Unstructured, 0)
					for _, c := range candidates {
						if c.GetKind() == "Deployment" {
							selected = append(selected, c)
						}
					}
					return selected
				})
			if err != nil {
				return err
			}
		} else {
			err = k.MultiYamlApply(deploy, namespace)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

// waitForOperator waits for an operator to exist in the namespace
func (o *OperatorResource) waitForOperator(namespace string, timeout time.Duration) (*Operator, error) {
	startTime := time.Now()
	for {
		ops, err := o.getOperators(namespace)
		if err != nil {
			return nil, err
		}
		if len(ops) > 0 {
			return &ops[0], nil
		}
		if time.Now().After(startTime.Add(timeout)) {
			return nil, errors2.NewTimeoutError("timed out waiting for status", 30)
		}
		time.Sleep(500 * time.Millisecond)
	}
}

func (o *OperatorResource) handlePutOp(request *restful.Request, response *restful.Response) {
	namespace := request.PathParameter("namespace")
	if namespace == "" {
		webError(response, http.StatusBadRequest, ErrNamespaceRequired)
		return
	}
	putParams := OperatorPutParams{}
	err := request.ReadEntity(&putParams)
	if err != nil {
		webError(response, http.StatusBadRequest, err)
		return
	}
	err = o.deployOrDeleteOperator(namespace, putParams.Version, false)
	if err != nil {
		webError(response, http.StatusInternalServerError, err)
		return
	}
	op, err := o.waitForOperator(namespace, 15*time.Second)
	if err != nil {
		webError(response, http.StatusInternalServerError, err)
		return
	}
	k := utils.GetK8s()
	k.ReleaseK8s()
	err = k.Reinit()
	if err != nil {
		log.Printf("Error reinitializing the Kubernetes client: %s", err)
		webError(response, http.StatusInternalServerError, err)
		return
	}
	_ = response.WriteEntity(op)
}

func (o *OperatorResource) handleDeleteOp(request *restful.Request, response *restful.Response) {
	namespace := request.PathParameter("namespace")
	if namespace == "" {
		webError(response, http.StatusBadRequest, ErrNamespaceRequired)
		return
	}
	err := o.deployOrDeleteOperator(namespace, "", true)
	if err != nil {
		webError(response, http.StatusInternalServerError, err)
		return
	}
	_ = response.WriteEntity(nil)
}
