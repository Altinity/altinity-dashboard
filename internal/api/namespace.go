package api

import (
	"context"
	"github.com/altinity/altinity-dashboard/internal/k8s"
	restful "github.com/emicklei/go-restful/v3"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

// NamespaceResource is the REST layer to Namespaces
type NamespaceResource struct {
}

// WebService creates a new service that can handle REST requests
func (o NamespaceResource) WebService() *restful.WebService {
	ws := new(restful.WebService)
	ws.
		Path("/api/v1/namespaces").
		Consumes(restful.MIME_JSON).
		Produces(restful.MIME_JSON)

	ws.Route(ws.GET("/").To(o.getNamespaces).
		// docs
		Doc("get all namespaces").
		Writes([]Pod{}).
		Returns(200, "OK", []Pod{}))

	ws.Route(ws.PUT("").To(o.createNamespace).
		// docs
		Doc("create a namespace").
		Reads(Namespace{})) // from the request

	return ws
}

// GET http://localhost:8080/namespaces
func (o NamespaceResource) getNamespaces(request *restful.Request, response *restful.Response) {
	namespaces, err := k8s.GetK8s().Clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	list := make([]Namespace, 0, len(namespaces.Items))
	for _, namespace := range namespaces.Items {
		list = append(list, Namespace{
			Name:      namespace.Name,
		})
	}
	_ = response.WriteEntity(list)
}

// PUT http://localhost:8080/namespaces
func (o NamespaceResource) createNamespace(request *restful.Request, response *restful.Response) {
	namespace := new(Namespace)
	err := request.ReadEntity(&namespace)
	if err != nil {
		_ = response.WriteError(http.StatusBadRequest, err)
		return
	}
	k := k8s.GetK8s().Clientset

	// Check if the namespace already exists
	namespaces, err := k8s.GetK8s().Clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{
		FieldSelector:        "metadata.name=" + namespace.Name,
		Limit:                1,
	})
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	if len(namespaces.Items) > 0 {
		_ = response.WriteEntity(namespace)
		return
	}

	// Create the namespace
	_, err = k.CoreV1().Namespaces().Create(
		context.TODO(),
		&v1.Namespace{
			ObjectMeta: metav1.ObjectMeta{
				Name: namespace.Name,
			},
		}, 
		metav1.CreateOptions{})
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	_ = response.WriteEntity(namespace)
}
