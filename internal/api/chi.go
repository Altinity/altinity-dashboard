package api

import (
	"context"
	"github.com/altinity/altinity-dashboard/internal/k8s"
	chopapi "github.com/altinity/clickhouse-operator/pkg/apis/clickhouse.altinity.com/v1"
	chopclientset "github.com/altinity/clickhouse-operator/pkg/client/clientset/versioned"
	restful "github.com/emicklei/go-restful/v3"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/scheme"
	"net/http"
)

// ChiResource is the REST layer to ClickHouse Installations
type ChiResource struct {
}

// WebService creates a new service that can handle REST requests
func (c *ChiResource) WebService() *restful.WebService {
	ws := new(restful.WebService)
	ws.
		Path("/api/v1/chis").
		Consumes(restful.MIME_JSON).
		Produces(restful.MIME_JSON)

	ws.Route(ws.GET("").To(c.getCHIs).
		// docs
		Doc("get all operators").
		Writes([]Pod{}).
		Returns(200, "OK", []Pod{}))

	return ws
}

// GET http://localhost:8080/chis
func (c *ChiResource) getCHIs(request *restful.Request, response *restful.Response) {
	k := k8s.GetK8s()
	cc, err := chopclientset.NewForConfig(k.Config)
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	chis, err := cc.ClickhouseV1().ClickHouseInstallations("").List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	list := make([]Chi, 0, len(chis.Items))
	for _, chi := range chis.Items {
		list = append(list, Chi{
			Name:      chi.Name,
			Namespace: chi.Namespace,
			Status:    chi.Status.Status,
			Clusters:  chi.ClustersCount(),
			Hosts:     chi.HostsCount(),
		})
	}
	_ = response.WriteEntity(list)
}

func init() {
	_ = chopapi.AddToScheme(scheme.Scheme)
}
