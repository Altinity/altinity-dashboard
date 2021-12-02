package api

import (
	"context"
	"fmt"
	"github.com/altinity/altinity-dashboard/internal/k8s"
	chopv1 "github.com/altinity/clickhouse-operator/pkg/apis/clickhouse.altinity.com/v1"
	"github.com/emicklei/go-restful/v3"
	v1 "k8s.io/api/core/v1"
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

// Name returns the name of the web service
func (c *ChiResource) Name() string {
	return "ClickHouse Instances"
}

// WebService creates a new service that can handle REST requests
func (c *ChiResource) WebService(wsi *WebServiceInfo) (*restful.WebService, error) {
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

	return ws, nil
}

func (c *ChiResource) getCHIs(request *restful.Request, response *restful.Response) {
	k := k8s.GetK8s()
	chis, err := k.ChopClientset.ClickhouseV1().ClickHouseInstallations("").List(
		context.TODO(), metav1.ListOptions{})
	if err != nil {
		webError(response, http.StatusBadRequest, "listing CHIs", err)
		return
	}
	list := make([]Chi, 0, len(chis.Items))
	for _, chi := range chis.Items {
		chClusters := make([]CHCluster, 0)
		_ = chi.WalkClusters(func(cluster *chopv1.ChiCluster) error {
			var chClusterPods []Pod
			sel := &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"clickhouse.altinity.com/chi":     chi.Name,
					"clickhouse.altinity.com/cluster": cluster.Name,
				},
				MatchExpressions: nil,
			}
			pods, err := getK8sPodsFromLabelSelector(chi.Namespace, sel)
			if err == nil {
				chClusterPods = getPodsFromK8sPods(pods)
			}
			chClusters = append(chClusters, CHCluster{
				Name: cluster.Name,
				Pods: chClusterPods,
			})
			return nil
		})
		var externalURL string
		var services *v1.ServiceList
		services, err = getK8sServicesFromLabelSelector("", &metav1.LabelSelector{
			MatchLabels: map[string]string{
				"clickhouse.altinity.com/chi": chi.Name,
			},
		})
		if err == nil {
			for _, svc := range services.Items {
				if _, ok := svc.Labels["clickhouse.altinity.com/cluster"]; !ok && svc.Spec.Type == "LoadBalancer" {
					for _, ing := range svc.Status.LoadBalancer.Ingress {
						externalHost := ""
						if ing.Hostname != "" {
							externalHost = ing.Hostname
						} else if ing.IP != "" {
							externalHost = ing.IP
						}
						if externalHost == "" {
							continue
						}
						for _, port := range svc.Spec.Ports {
							if port.Name == "http" {
								externalURL = fmt.Sprintf("http://%s:%d", externalHost, port.Port)
								break
							}
						}
						if externalURL != "" {
							break
						}
					}
				}
			}
		}
		list = append(list, Chi{
			Name:        chi.Name,
			Namespace:   chi.Namespace,
			Status:      chi.Status.Status,
			Clusters:    chi.Status.ClustersCount,
			Hosts:       chi.Status.HostsCount,
			ExternalURL: externalURL,
			CHClusters:  chClusters,
		})
	}
	_ = response.WriteEntity(list)
}

func (c *ChiResource) handlePutCHI(request *restful.Request, response *restful.Response) {
	putParams := ChiPutParams{}
	err := request.ReadEntity(&putParams)
	if err != nil {
		webError(response, http.StatusBadRequest, "reading request body", err)
		return
	}
	err = k8s.GetK8s().DoApply(putParams.YAML, putParams.Namespace, true)
	if err != nil {
		webError(response, http.StatusInternalServerError, "applying CHI", err)
		return
	}
	_ = response.WriteEntity(nil)
}

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
