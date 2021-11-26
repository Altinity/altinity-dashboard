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
func (n *NamespaceResource) WebService() *restful.WebService {
	ws := new(restful.WebService)
	ws.
		Path("/api/v1/namespaces").
		Consumes(restful.MIME_JSON).
		Produces(restful.MIME_JSON)

	ws.Route(ws.GET("").To(n.getNamespaces).
		Doc("get all namespaces").
		Writes([]Namespace{}).
		Returns(200, "OK", []Namespace{}))

	ws.Route(ws.PUT("").To(n.createNamespace).
		Doc("create a namespace").
		Reads(Namespace{})) // from the request

	return ws
}

// GET http://localhost:8080/namespaces
func (n *NamespaceResource) getNamespaces(request *restful.Request, response *restful.Response) {
	namespaces, err := k8s.GetK8s().Clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		webError(response, http.StatusInternalServerError, "listing namespaces", err)
		return
	}
	list := make([]Namespace, 0, len(namespaces.Items))
	for _, namespace := range namespaces.Items {
		list = append(list, Namespace{
			Name: namespace.Name,
		})
	}
	_ = response.WriteEntity(list)
}

// PUT http://localhost:8080/namespaces
func (n *NamespaceResource) createNamespace(request *restful.Request, response *restful.Response) {
	namespace := new(Namespace)
	err := request.ReadEntity(&namespace)
	if err != nil {
		webError(response, http.StatusBadRequest, "reading request body", err)
		return
	}

	// Check if the namespace already exists
	k := k8s.GetK8s().Clientset
	namespaces, err := k8s.GetK8s().Clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{
		FieldSelector: "metadata.name=" + namespace.Name,
		Limit:         1,
	})
	if err != nil {
		webError(response, http.StatusInternalServerError, "listing namespaces", err)
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
		webError(response, http.StatusInternalServerError, "creating namespace", err)
		return
	}
	_ = response.WriteEntity(namespace)
}
