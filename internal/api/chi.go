package api

import (
	"context"
	"errors"
	"fmt"
	"github.com/altinity/altinity-dashboard/internal/utils"
	chopv1 "github.com/altinity/clickhouse-operator/pkg/apis/clickhouse.altinity.com/v1"
	"github.com/emicklei/go-restful/v3"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"net/http"
)

// ChiResource is the REST layer to ClickHouse Installations
type ChiResource struct {
}

// ChiPutParams is the object for parameters to a CHI PUT request
type ChiPutParams struct {
	YAML string `json:"yaml" description:"YAML of the CHI custom resource"`
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

	ws.Route(ws.GET("").To(c.getCHIs).
		Doc("get all ClickHouse Installations").
		Writes([]Chi{}).
		Returns(200, "OK", []Chi{}))

	ws.Route(ws.GET("/{namespace}").To(c.getCHIs).
		Doc("get all ClickHouse Installations in a namespace").
		Param(ws.PathParameter("namespace", "namespace to get from").DataType("string")).
		Writes([]Chi{}).
		Returns(200, "OK", []Chi{}))

	ws.Route(ws.PUT("/{namespace}").To(c.handlePutCHI).
		Doc("deploy a ClickHouse Installation from YAML").
		Param(ws.PathParameter("namespace", "namespace to deploy to").DataType("string")).
		Reads(ChiPutParams{}).
		Returns(200, "OK", nil))

	ws.Route(ws.DELETE("/{namespace}/{name}").To(c.handleDeleteCHI).
		Doc("delete a ClickHouse installation").
		Param(ws.PathParameter("namespace", "namespace to delete from").DataType("string")).
		Param(ws.PathParameter("name", "name of the CHI to delete").DataType("string")).
		Returns(200, "OK", nil))

	return ws, nil
}

func (c *ChiResource) getCHIs(request *restful.Request, response *restful.Response) {
	namespace, ok := request.PathParameters()["namespace"]
	if !ok {
		namespace = ""
	}

	k := utils.GetK8s()
	chis, err := k.ChopClientset.ClickhouseV1().ClickHouseInstallations(namespace).List(
		context.TODO(), metav1.ListOptions{})
	if err != nil {
		webError(response, http.StatusBadRequest, "listing CHIs", err)
		return
	}
	list := make([]Chi, 0, len(chis.Items))
	for _, chi := range chis.Items {
		chClusterPods := make([]CHClusterPod, 0)
		_ = chi.WalkClusters(func(cluster *chopv1.ChiCluster) error {
			sel := &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"clickhouse.altinity.com/chi":     chi.Name,
					"clickhouse.altinity.com/cluster": cluster.Name,
				},
				MatchExpressions: nil,
			}
			pods, err := getK8sPodsFromLabelSelector(chi.Namespace, sel)
			if err == nil {
				for _, pod := range getPodsFromK8sPods(pods) {
					chClusterPod := CHClusterPod{
						Pod:         pod,
						ClusterName: cluster.Name,
					}
					chClusterPods = append(chClusterPods, chClusterPod)
				}
			}
			return nil
		})
		var externalURL string
		var services *v1.ServiceList
		services, err = getK8sServicesFromLabelSelector(namespace, &metav1.LabelSelector{
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
			Name:          chi.Name,
			Namespace:     chi.Namespace,
			Status:        chi.Status.Status,
			Clusters:      chi.Status.ClustersCount,
			Hosts:         chi.Status.HostsCount,
			ExternalURL:   externalURL,
			CHClusterPods: chClusterPods,
		})
	}
	_ = response.WriteEntity(list)
}

var ErrNamespaceRequired = errors.New("namespace is required")
var ErrNameAndNamespaceRequired = errors.New("name and namespace are required")
var ErrYAMLMustBeCHI = errors.New("YAML document must contain a single ClickhouseInstallation definition")

func (c *ChiResource) handlePutCHI(request *restful.Request, response *restful.Response) {
	namespace, ok := request.PathParameters()["namespace"]
	if !ok || namespace == "" {
		webError(response, http.StatusBadRequest, "processing request", ErrNamespaceRequired)
		return
	}

	putParams := ChiPutParams{}
	err := request.ReadEntity(&putParams)
	if err != nil {
		webError(response, http.StatusBadRequest, "reading request body", err)
		return
	}
	var rejected = false
	err = utils.GetK8s().DoApplySelectively(putParams.YAML, namespace,
		func(candidates []*unstructured.Unstructured) []*unstructured.Unstructured {
			if len(candidates) != 1 {
				rejected = true
				return nil
			}
			if candidates[0].GetKind() != "ClickHouseInstallation" {
				rejected = true
				return nil
			}
			return candidates
		})
	if rejected {
		webError(response, http.StatusBadRequest, "processing request", ErrYAMLMustBeCHI)
		return
	}
	if err != nil {
		webError(response, http.StatusInternalServerError, "applying CHI", err)
		return
	}
	_ = response.WriteEntity(nil)
}

func (c *ChiResource) handleDeleteCHI(request *restful.Request, response *restful.Response) {
	namespace, ok1 := request.PathParameters()["namespace"]
	name, ok2 := request.PathParameters()["name"]
	if !ok1 || !ok2 || name == "" || namespace == "" {
		webError(response, http.StatusBadRequest, "processing request", ErrNameAndNamespaceRequired)
		return
	}

	err := utils.GetK8s().ChopClientset.ClickhouseV1().
		ClickHouseInstallations(namespace).
		Delete(context.TODO(), name, metav1.DeleteOptions{})
	if err != nil {
		webError(response, http.StatusInternalServerError, "deleting CHI", err)
		return
	}

	_ = response.WriteEntity(nil)
}
