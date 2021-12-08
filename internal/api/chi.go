package api

import (
	"context"
	"errors"
	"fmt"
	"github.com/altinity/altinity-dashboard/internal/utils"
	chopv1 "github.com/altinity/clickhouse-operator/pkg/apis/clickhouse.altinity.com/v1"
	"github.com/emicklei/go-restful/v3"
	"github.com/kubernetes-sigs/yaml"
	v1 "k8s.io/api/core/v1"
	errors2 "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"log"
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
func (c *ChiResource) WebService(_ *WebServiceInfo) (*restful.WebService, error) {
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

	ws.Route(ws.GET("/{namespace}/{name}").To(c.getCHIs).
		Doc("get a single ClickHouse Installation").
		Param(ws.PathParameter("namespace", "namespace to get from").DataType("string")).
		Param(ws.PathParameter("name", "name of the CHI to get").DataType("string")).
		Writes([]Chi{}).
		Returns(200, "OK", []Chi{}))

	ws.Route(ws.POST("/{namespace}").To(c.handlePostCHI).
		Doc("deploy a new ClickHouse Installation from YAML").
		Param(ws.PathParameter("namespace", "namespace to deploy to").DataType("string")).
		Reads(ChiPutParams{}).
		Returns(200, "OK", nil))

	ws.Route(ws.PATCH("/{namespace}/{name}").To(c.handlePatchCHI).
		Doc("update an existing ClickHouse Installation from YAML").
		Param(ws.PathParameter("namespace", "namespace the CHI is in").DataType("string")).
		Param(ws.PathParameter("name", "name of the CHI to update").DataType("string")).
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
	name, ok := request.PathParameters()["name"]
	if !ok {
		name = ""
	}

	k := utils.GetK8s()
	defer func() { k.ReleaseK8s() }()
	var fieldSelector string
	if name != "" {
		fieldSelector = "metadata.name=" + name
	}

	getCHIs := func() (*chopv1.ClickHouseInstallationList, error) {
		chis, err := k.ChopClientset.ClickhouseV1().ClickHouseInstallations(namespace).List(
			context.TODO(), metav1.ListOptions{
				FieldSelector: fieldSelector,
			})
		if err != nil {
			var se *errors2.StatusError
			if errors.As(err, &se) {
				if se.ErrStatus.Reason == metav1.StatusReasonNotFound &&
					se.ErrStatus.Details.Group == "clickhouse.altinity.com" {
					return nil, utils.ErrOperatorNotDeployed
				}
			}
			return nil, err
		}
		return chis, nil
	}
	chis, err := getCHIs()
	if errors.Is(err, utils.ErrOperatorNotDeployed) {
		// Before returning ErrOperatorNotDeployed, try reinitializing the k8s client, which may
		// be holding old information in its cache.  (For example, it may not know about a CRD.)
		k.ReleaseK8s()
		err = k.Reinit()
		k = utils.GetK8s()
		if err != nil {
			log.Printf("Error reinitializing the Kubernetes client: %s", err)
			webError(response, http.StatusInternalServerError, err)
			return
		}
		chis, err = getCHIs()
	}
	if err != nil {
		webError(response, http.StatusInternalServerError, err)
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
			var pods *v1.PodList
			pods, err = getK8sPodsFromLabelSelector(chi.Namespace, sel)
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
		var y []byte
		y, err = yaml.Marshal(ResourceSpec{
			APIVersion: chi.APIVersion,
			Kind:       chi.Kind,
			Metadata: ResourceSpecMetadata{
				Name:            chi.Name,
				Namespace:       chi.Namespace,
				ResourceVersion: chi.ResourceVersion,
			},
			Spec: chi.Spec,
		})
		if err != nil {
			y = nil
		}
		list = append(list, Chi{
			Name:          chi.Name,
			Namespace:     chi.Namespace,
			Status:        chi.Status.Status,
			Clusters:      chi.Status.ClustersCount,
			Hosts:         chi.Status.HostsCount,
			ExternalURL:   externalURL,
			ResourceYAML:  string(y),
			CHClusterPods: chClusterPods,
		})
	}
	_ = response.WriteEntity(list)
}

var ErrNamespaceRequired = errors.New("namespace is required")
var ErrNameRequired = errors.New("name is required")
var ErrYAMLMustBeCHI = errors.New("YAML document must contain a single ClickhouseInstallation definition")

func (c *ChiResource) handlePostOrPatchCHI(request *restful.Request, response *restful.Response, doPost bool) {
	namespace, ok := request.PathParameters()["namespace"]
	if !ok || namespace == "" {
		webError(response, http.StatusBadRequest, ErrNamespaceRequired)
		return
	}
	name := ""
	if !doPost {
		name, ok = request.PathParameters()["name"]
		if !ok || name == "" {
			webError(response, http.StatusBadRequest, ErrNameRequired)
			return
		}
	}

	putParams := ChiPutParams{}
	err := request.ReadEntity(&putParams)
	if err != nil {
		webError(response, http.StatusBadRequest, err)
		return
	}

	k := utils.GetK8s()
	defer func() { k.ReleaseK8s() }()
	var obj *unstructured.Unstructured
	obj, err = utils.DecodeYAMLToObject(putParams.YAML)
	if err != nil {
		webError(response, http.StatusBadRequest, err)
		return
	}
	if obj.GetAPIVersion() != "clickhouse.altinity.com/v1" ||
		obj.GetKind() != "ClickHouseInstallation" ||
		(!doPost && (obj.GetNamespace() != namespace ||
			obj.GetName() != name)) {
		webError(response, http.StatusBadRequest, ErrYAMLMustBeCHI)
		return
	}
	if doPost {
		err = k.SingleObjectCreate(obj, namespace)
	} else {
		err = k.SingleObjectUpdate(obj, namespace)
	}
	if err != nil {
		webError(response, http.StatusInternalServerError, err)
		return
	}
	_ = response.WriteEntity(nil)
}

func (c *ChiResource) handlePostCHI(request *restful.Request, response *restful.Response) {
	c.handlePostOrPatchCHI(request, response, true)
}

func (c *ChiResource) handlePatchCHI(request *restful.Request, response *restful.Response) {
	c.handlePostOrPatchCHI(request, response, false)
}

func (c *ChiResource) handleDeleteCHI(request *restful.Request, response *restful.Response) {
	namespace, ok := request.PathParameters()["namespace"]
	if !ok || namespace == "" {
		webError(response, http.StatusBadRequest, ErrNamespaceRequired)
		return
	}
	var name string
	name, ok = request.PathParameters()["name"]
	if !ok || name == "" {
		webError(response, http.StatusBadRequest, ErrNameRequired)
		return
	}

	k := utils.GetK8s()
	defer func() { k.ReleaseK8s() }()
	err := k.ChopClientset.ClickhouseV1().
		ClickHouseInstallations(namespace).
		Delete(context.TODO(), name, metav1.DeleteOptions{})
	if err != nil {
		webError(response, http.StatusInternalServerError, err)
		return
	}

	_ = response.WriteEntity(nil)
}
