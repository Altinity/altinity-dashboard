package api

import (
	"context"
	"embed"
	"fmt"
	"github.com/altinity/altinity-dashboard/internal/k8s"
	"github.com/drone/envsubst"
	"github.com/emicklei/go-restful/v3"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"net/http"
	"strings"
	"time"
)

// OperatorResource is the REST layer to Pods
type OperatorResource struct {
	opDeployTemplate *envsubst.Template
	release          string
}

// OperatorPutParams is the object for parameters to an operator PUT request
type OperatorPutParams struct {
	Version string `json:"version" description:"version of clickhouse-operator to deploy"`
}

// WebService creates a new service that can handle REST requests
func (o *OperatorResource) WebService(chopFiles *embed.FS) (*restful.WebService, error) {
	bytes, err := chopFiles.ReadFile("embed/chop-release")
	if err != nil {
		return nil, err
	}
	o.release = strings.TrimSpace(string(bytes))

	bytes, err = chopFiles.ReadFile("embed/clickhouse-operator-install-template.yaml")
	if err != nil {
		return nil, err
	}
	o.opDeployTemplate, err = envsubst.Parse(string(bytes))
	if err != nil {
		return nil, err
	}

	ws := new(restful.WebService)
	ws.
		Path("/api/v1/operators").
		Consumes(restful.MIME_JSON).
		Produces(restful.MIME_JSON)

	ws.Route(ws.GET("").To(o.handleGet).
		// docs
		Doc("get all operators").
		Writes([]Operator{}).
		Returns(200, "OK", []Operator{}))

	ws.Route(ws.PUT("/{namespace}").To(o.handlePut).
		// docs
		Doc("deploy an operator").
		Param(ws.PathParameter("namespace", "namespace to deploy to").DataType("string")).
		Reads(OperatorPutParams{}).
		Returns(200, "OK", Operator{}))

	ws.Route(ws.DELETE("/{namespace}").To(o.handleDelete).
		// docs
		Doc("delete an operator").
		Param(ws.PathParameter("namespace", "namespace to delete from").DataType("string")).
		Returns(200, "OK", nil))

	return ws, nil
}

// getContainersFromPod gets a list of OperatorContainers from a pod
func (o *OperatorResource) getContainersFromPod(pod corev1.Pod) []OperatorContainer {
	cs := pod.Status.ContainerStatuses
	list := make([]OperatorContainer, 0, len(cs))
	for _, c := range cs {
		state := "Unknown"
		switch {
		case c.State.Terminated != nil:
			state = "Terminated"
		case c.State.Running != nil:
			state = "Running"
		case c.State.Waiting != nil:
			state = "Waiting"
		}
		list = append(list, OperatorContainer{
			Name:  c.Name,
			State: state,
			Image: c.Image,
		})
	}
	return list
}

// getPodsFromDeployment gets a list of OperatorPods from a deployment
func (o *OperatorResource) getPodsFromDeployment(namespace string, deployment appsv1.Deployment) ([]OperatorPod, error) {
	s := deployment.Spec.Selector
	ls, err := metav1.LabelSelectorAsMap(s)
	if err != nil {
		return nil, err
	}
	pods, err := k8s.GetK8s().Clientset.CoreV1().Pods(namespace).List(context.TODO(),
		metav1.ListOptions{
			LabelSelector: labels.SelectorFromSet(ls).String(),
		},
	)
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
			Name:       pod.Name,
			Status:     string(pod.Status.Phase),
			Version:    ver,
			Containers: o.getContainersFromPod(pod),
		})
	}
	return list, nil
}

// Get a list of running clickhouse-operators
func (o *OperatorResource) getOperators(namespace string) ([]Operator, error) {
	deployments, err := k8s.GetK8s().Clientset.AppsV1().Deployments(namespace).List(
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
		pods, err := o.getPodsFromDeployment(deployment.Namespace, deployment)
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

// GET http://localhost:8080/operators
func (o *OperatorResource) handleGet(request *restful.Request, response *restful.Response) {
	ops, err := o.getOperators("")
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	_ = response.WriteEntity(ops)
}

// deployOrDeleteOperator deploys or deletes a clickhouse-operator
func (o *OperatorResource) deployOrDeleteOperator(namespace string, version string, doDelete bool) error {
	if version == "" {
		version = o.release
	}
	deploy, err := o.opDeployTemplate.Execute(func(key string) string {
		s, ok := map[string]string{
			"OPERATOR_IMAGE":             fmt.Sprintf("altinity/clickhouse-operator:%s", version),
			"METRICS_EXPORTER_IMAGE":     fmt.Sprintf("altinity/metrics-exporter:%s", version),
			"OPERATOR_NAMESPACE":         namespace,
			"METRICS_EXPORTER_NAMESPACE": namespace,
		}[key]
		if ok {
			return s
		}
		return ""
	})
	if err != nil {
		return err
	}

	k := k8s.GetK8s()
	if doDelete {
		err = k.DoDelete(deploy, "")
	} else {
		err = k.DoApply(deploy, "")
	}
	if err != nil {
		return err
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
			return nil, errors.NewTimeoutError("timed out waiting for status", 30)
		}
		time.Sleep(500 * time.Millisecond)
	}
}

// PUT http://localhost:8080/operators
func (o *OperatorResource) handlePut(request *restful.Request, response *restful.Response) {
	namespace := request.PathParameter("namespace")
	if namespace == "" {
		_ = response.WriteError(http.StatusBadRequest, restful.ServiceError{Message: "namespace is required"})
		return
	}
	putParams := OperatorPutParams{}
	err := request.ReadEntity(&putParams)
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	err = o.deployOrDeleteOperator(namespace, putParams.Version, false)
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	op, err := o.waitForOperator(namespace, 15*time.Second)
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	_ = response.WriteEntity(op)
}

// DELETE http://localhost:8080/operators
func (o *OperatorResource) handleDelete(request *restful.Request, response *restful.Response) {
	namespace := request.PathParameter("namespace")
	if namespace == "" {
		_ = response.WriteError(http.StatusBadRequest, restful.ServiceError{Message: "namespace is required"})
		return
	}
	err := o.deployOrDeleteOperator(namespace, "", true)
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	_ = response.WriteEntity(nil)
}
