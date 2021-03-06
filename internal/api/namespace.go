package api

import (
	"context"
	"github.com/altinity/altinity-dashboard/internal/utils"
	"github.com/emicklei/go-restful/v3"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

// NamespaceResource is the REST layer to Namespaces
type NamespaceResource struct {
}

// Name returns the name of the web service
func (n *NamespaceResource) Name() string {
	return "Namespaces"
}

// WebService creates a new service that can handle REST requests
func (n *NamespaceResource) WebService(_ *WebServiceInfo) (*restful.WebService, error) {
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

	return ws, nil
}

func (n *NamespaceResource) getNamespaces(_ *restful.Request, response *restful.Response) {
	k := utils.GetK8s()
	defer func() { k.ReleaseK8s() }()
	namespaces, err := k.Clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		webError(response, http.StatusInternalServerError, err)
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

func (n *NamespaceResource) createNamespace(request *restful.Request, response *restful.Response) {
	namespace := new(Namespace)
	err := request.ReadEntity(&namespace)
	if err != nil {
		webError(response, http.StatusBadRequest, err)
		return
	}

	// Check if the namespace already exists
	k := utils.GetK8s()
	defer func() { k.ReleaseK8s() }()
	namespaces, err := k.Clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{
		FieldSelector: "metadata.name=" + namespace.Name,
		Limit:         1,
	})
	if err != nil {
		webError(response, http.StatusInternalServerError, err)
		return
	}
	if len(namespaces.Items) > 0 {
		_ = response.WriteEntity(namespace)
		return
	}

	// Create the namespace
	_, err = k.Clientset.CoreV1().Namespaces().Create(
		context.TODO(),
		&v1.Namespace{
			ObjectMeta: metav1.ObjectMeta{
				Name: namespace.Name,
			},
		},
		metav1.CreateOptions{})
	if err != nil {
		webError(response, http.StatusInternalServerError, err)
		return
	}
	_ = response.WriteEntity(namespace)
}
