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

type OperatorDeploy struct {
	Namespace string `json:"namespace" description:"namespace the operator will be deployed into"`
}

// WebService creates a new service that can handle REST requests
func (o OperatorResource) WebService(chopFiles *embed.FS) (*restful.WebService, error) {
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

	ws.Route(ws.GET("").To(o.handleGetOperators).
		// docs
		Doc("get all operators").
		Writes([]Pod{}).
		Returns(200, "OK", []Pod{}))

	ws.Route(ws.POST("").To(o.handlePostOperators).
		// docs
		Doc("deploy an operator").
		Reads(OperatorDeploy{}).
		Returns(200, "OK", Operator{}))

	return ws, nil
}

// Get a list of running clickhouse-operators
func (o OperatorResource) getOperators(namespace string) ([]Operator, error) {
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
func (o OperatorResource) handleGetOperators(request *restful.Request, response *restful.Response) {
	ops, err := o.getOperators("")
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	_ = response.WriteEntity(ops)
}

// POST http://localhost:8080/operators
func (o OperatorResource) handlePostOperators(request *restful.Request, response *restful.Response) {
	od := new(OperatorDeploy)
	err := request.ReadEntity(&od)
	if err != nil {
		_ = response.WriteError(http.StatusBadRequest, err)
		return
	}

	deploy, err := o.opDeployTemplate.Execute(func(key string) string {
		s, ok := map[string]string{
			"OPERATOR_IMAGE":             fmt.Sprintf("altinity/clickhouse-operator:%s", o.release),
			"METRICS_EXPORTER_IMAGE":     fmt.Sprintf("altinity/metrics-exporter:%s", o.release),
			"OPERATOR_NAMESPACE":         od.Namespace,
			"METRICS_EXPORTER_NAMESPACE": od.Namespace,
		}[key]
		if ok {
			return s
		}
		return ""
	})
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}

	k := k8s.GetK8s()
	err = k.DoApply(deploy)
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}

	startTime := time.Now()
	for {
		ops, err := o.getOperators(od.Namespace)
		if err != nil {
			_ = response.WriteError(http.StatusInternalServerError, err)
			return
		}
		if len(ops) > 0 {
			_ = response.WriteEntity(ops[0])
			return
		}
		if time.Now().After(startTime.Add(15 * time.Second)) {
			_ = response.WriteError(http.StatusInternalServerError,
				errors.NewTimeoutError("timed out waiting for status", 30))
			return
		}
		time.Sleep(500 * time.Millisecond)
	}
}
