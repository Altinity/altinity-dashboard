package api

import (
	"github.com/altinity/altinity-dashboard/internal/k8s"
	restful "github.com/emicklei/go-restful/v3"
)

// PodResource is the REST layer to Pods
type PodResource struct {
}

// WebService creates a new service that can handle REST requests
func (u PodResource) WebService() *restful.WebService {
	ws := new(restful.WebService)
	ws.
		Path("/api/v1/pods").
		Consumes(restful.MIME_JSON).
		Produces(restful.MIME_JSON)

	ws.Route(ws.GET("/").To(u.getAllPods).
		// docs
		Doc("get all pods").
		Writes([]Pod{}).
		Returns(200, "OK", []Pod{}))

	return ws
}

// GET http://localhost:8080/pods
func (u PodResource) getAllPods(request *restful.Request, response *restful.Response) {
	pods, err := k8s.GetK8s().GetPods()
	if err != nil {
		_ = response.WriteError(500, err)
	}
	list := make([]Pod, 0, len(pods.Items))
	for _, pod := range pods.Items {
		list = append(list, Pod{
			Name: pod.Name,
		})
	}
	_ = response.WriteEntity(list)
}
