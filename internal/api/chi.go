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

// ChiPutParams is the object for parameters to a CHI PUT request
type ChiPutParams struct {
	Namespace string `json:"namespace" description:"namespace to deploy the CHI to"`
	YAML      string `json:"yaml" description:"YAML of the CHI custom resource"`
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
		Doc("get all ClickHouse Installations").
		Writes([]Chi{}).
		Returns(200, "OK", []Chi{}))

	ws.Route(ws.PUT("").To(c.handlePut).
		// docs
		Doc("deploy a ClickHouse Installation").
		Reads(ChiPutParams{}).
		Returns(200, "OK", nil))

	ws.Route(ws.DELETE("/{chi-name}").To(c.handleDelete).
		// docs
		Doc("delete a ClickHouse installation").
		Param(ws.PathParameter("chi-name", "ClickHouse Installation to delete").DataType("string")).
		Returns(200, "OK", nil))

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

// PUT http://localhost:8080/chis
func (c *ChiResource) handlePut(request *restful.Request, response *restful.Response) {
	putParams := ChiPutParams{}
	err := request.ReadEntity(&putParams)
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	err = k8s.GetK8s().DoApply(putParams.YAML, putParams.Namespace)
	if err != nil {
		_ = response.WriteError(http.StatusInternalServerError, err)
		return
	}
	_ = response.WriteEntity(nil)
}

// DELETE http://localhost:8080/chis
func (c *ChiResource) handleDelete(request *restful.Request, response *restful.Response) {
	chiName := request.PathParameter("chi-name")
	if chiName == "" {
		_ = response.WriteError(http.StatusBadRequest, restful.ServiceError{Message: "chi-name is required"})
		return
	}
	_ = response.WriteError(http.StatusNotImplemented, restful.ServiceError{Message: "Not Implemented"})
}

func init() {
	// Register the ClickHouse CRD structs with client-go
	_ = chopapi.AddToScheme(scheme.Scheme)
}
