package api

import (
	"context"
	"github.com/altinity/altinity-dashboard/internal/k8s"
	restful "github.com/emicklei/go-restful/v3"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

// OperatorResource is the REST layer to Pods
type OperatorResource struct {
}

// WebService creates a new service that can handle REST requests
func (o OperatorResource) WebService() *restful.WebService {
	ws := new(restful.WebService)
	ws.
		Path("/api/v1/operators").
		Consumes(restful.MIME_JSON).
		Produces(restful.MIME_JSON)

	ws.Route(ws.GET("/").To(o.getOperators).
		// docs
		Doc("get all operators").
		Writes([]Pod{}).
		Returns(200, "OK", []Pod{}))

	return ws
}

// GET http://localhost:8080/operators
func (o OperatorResource) getOperators(request *restful.Request, response *restful.Response) {
	pods, err := k8s.GetK8s().Clientset.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{
		LabelSelector: "app=clickhouse-operator",
	})
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
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
	_ = response.WriteEntity(list)
}
