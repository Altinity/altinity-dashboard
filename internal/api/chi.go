package api

import (
	"context"
	"github.com/altinity/altinity-dashboard/internal/k8s"
	"github.com/emicklei/go-restful/v3"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

// ChiDeleteParams is the object for parameters to a CHI DELETE request
type ChiDeleteParams struct {
	Namespace string `json:"namespace" description:"namespace to delete the CHI from"`
	ChiName   string `json:"chi_name" description:"name op the CHI to delete"`
}

// WebService creates a new service that can handle REST requests
func (c *ChiResource) WebService() *restful.WebService {
	ws := new(restful.WebService)
	ws.
		Path("/api/v1/chis").
		Consumes(restful.MIME_JSON).
		Produces(restful.MIME_JSON)

	// This is not very RESTful - the PUT and DELETE ought to take path parameters.

	ws.Route(ws.GET("").To(c.getCHIs).
		Doc("get all ClickHouse Installations").
		Writes([]Chi{}).
		Returns(200, "OK", []Chi{}))

	ws.Route(ws.PUT("").To(c.handlePutCHI).
		Doc("deploy a ClickHouse Installation from YAML").
		Reads(ChiPutParams{}).
		Returns(200, "OK", nil))

	ws.Route(ws.DELETE("").To(c.handleDeleteCHI).
		Doc("delete a ClickHouse installation").
		Reads(ChiDeleteParams{}).
		Returns(200, "OK", nil))

	return ws
}

// GET http://localhost:8080/chis
func (c *ChiResource) getCHIs(request *restful.Request, response *restful.Response) {
	chis, err := k8s.GetK8s().ChopClientset.ClickhouseV1().ClickHouseInstallations("").List(
		context.TODO(), metav1.ListOptions{})
	if err != nil {
		webError(response, http.StatusBadRequest, "listing CHIs", err)
		return
	}
	list := make([]Chi, 0, len(chis.Items))
	for _, chi := range chis.Items {
		list = append(list, Chi{
			Name:      chi.Name,
			Namespace: chi.Namespace,
			Status:    chi.Status.Status,
			Clusters:  chi.Status.ClustersCount,
			Hosts:     chi.Status.HostsCount,
		})
	}
	_ = response.WriteEntity(list)
}

// PUT http://localhost:8080/chis
func (c *ChiResource) handlePutCHI(request *restful.Request, response *restful.Response) {
	putParams := ChiPutParams{}
	err := request.ReadEntity(&putParams)
	if err != nil {
		webError(response, http.StatusBadRequest, "reading request body", err)
		return
	}
	err = k8s.GetK8s().DoApply(putParams.YAML, putParams.Namespace)
	if err != nil {
		webError(response, http.StatusInternalServerError, "applying CHI", err)
		return
	}
	_ = response.WriteEntity(nil)
}

// DELETE http://localhost:8080/chis
func (c *ChiResource) handleDeleteCHI(request *restful.Request, response *restful.Response) {
	deleteParams := ChiDeleteParams{}
	err := request.ReadEntity(&deleteParams)
	if err != nil {
		webError(response, http.StatusBadRequest, "reading request body", err)
		return
	}

	if deleteParams.ChiName == "" {
		webError(response, http.StatusBadRequest, "processing request",
			restful.ServiceError{Message: "chi_name is required"})
		return
	}

	if deleteParams.Namespace == "" {
		webError(response, http.StatusBadRequest, "processing request",
			restful.ServiceError{Message: "namespace is required"})
		return
	}

	err = k8s.GetK8s().ChopClientset.ClickhouseV1().
		ClickHouseInstallations(deleteParams.Namespace).
		Delete(context.TODO(), deleteParams.ChiName, metav1.DeleteOptions{})
	if err != nil {
		webError(response, http.StatusInternalServerError, "deleting CHI", err)
		return
	}

	_ = response.WriteEntity(nil)
}
