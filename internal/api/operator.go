package api

import (
	"context"
	"embed"
	"fmt"
	"github.com/altinity/altinity-dashboard/internal/k8s"
	"github.com/drone/envsubst"
	restful "github.com/emicklei/go-restful/v3"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	"strings"
	"time"
)

// OperatorResource is the REST layer to Pods
type OperatorResource struct {
	opDeployTemplate *envsubst.Template
	release          string
}

// WebService creates a new service that can handle REST requests
func (o *OperatorResource) WebService(chopFiles *embed.FS) (*restful.WebService, error) {
	bytes, err := chopFiles.ReadFile("embed/release")
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
		Writes([]Pod{}).
		Returns(200, "OK", []Pod{}))

	ws.Route(ws.PUT("/{namespace}").To(o.handlePut).
		// docs
		Doc("deploy an operator").
		Param(ws.PathParameter("namespace", "namespace to deploy to").DataType("string")).
		Param(ws.BodyParameter("version", "version to deploy").DataType("string")).
		Returns(200, "OK", Operator{}))

	ws.Route(ws.DELETE("/{namespace}").To(o.handleDelete).
		// docs
		Doc("delete an operator").
		Param(ws.PathParameter("namespace", "namespace to delete from").DataType("string")).
		Returns(200, "OK", nil))

	return ws, nil
}

// Get a list of running clickhouse-operators
func (o *OperatorResource) getOperators(namespace string) ([]Operator, error) {
	listOptions := metav1.ListOptions{
		LabelSelector: "app=clickhouse-operator",
	}
	if namespace != "" {
		listOptions.FieldSelector = fmt.Sprintf("metadata.namespace=%s", namespace)
	}
	pods, err := k8s.GetK8s().Clientset.CoreV1().Pods("").List(context.TODO(), listOptions)
	if err != nil {
		return nil, err
	}
	list := make([]Operator, 0, len(pods.Items))
	for _, pod := range pods.Items {
		list = append(list, Operator{
			Name:      pod.Name,
			Namespace: pod.Namespace,
			Status:    string(pod.Status.Phase),
			Version:   pod.Spec.Containers[0].Image,
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

// POST http://localhost:8080/operators
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
		err = k.DoDelete(deploy)
	} else {
		err = k.DoApply(deploy)
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
	version, err := request.BodyParameter("version")
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	err = o.deployOrDeleteOperator(namespace, version, false)
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
