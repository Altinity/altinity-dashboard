package api

import (
	"context"
	"github.com/altinity/altinity-dashboard/internal/utils"
	chopv1 "github.com/altinity/clickhouse-operator/pkg/apis/clickhouse.altinity.com/v1"
	"github.com/emicklei/go-restful/v3"
	v1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// DashboardResource is the REST layer to the dashboard
type DashboardResource struct {
}

// Name returns the name of the web service
func (d *DashboardResource) Name() string {
	return "Dashboard"
}

// WebService creates a new service that can handle REST requests
func (d *DashboardResource) WebService(_ *WebServiceInfo) (*restful.WebService, error) {
	ws := new(restful.WebService)
	ws.
		Path("/api/v1/dashboard").
		Produces(restful.MIME_JSON)

	ws.Route(ws.GET("").To(d.getDashboard).
		Doc("get dashboard information").
		Writes(Dashboard{}).
		Returns(200, "OK", Dashboard{}))

	return ws, nil
}

func (d *DashboardResource) getDashboard(_ *restful.Request, response *restful.Response) {
	dash := Dashboard{}

	k := utils.GetK8s()
	dash.KubeCluster = k.Config.Host
	sv, err := k.Clientset.ServerVersion()
	if err == nil {
		dash.KubeVersion = sv.String()
	} else {
		dash.KubeVersion = "unknown"
	}

	// Get clickhouse-operator counts
	var chops *v1.DeploymentList
	chops, err = utils.GetK8s().Clientset.AppsV1().Deployments("").List(
		context.TODO(), metav1.ListOptions{
			LabelSelector: "app=clickhouse-operator",
		})
	if err == nil {
		dash.ChopCount = len(chops.Items)
		dash.ChopCountAvailable = 0
		for _, chop := range chops.Items {
			for _, cond := range chop.Status.Conditions {
				if cond.Status == corev1.ConditionTrue && cond.Type == v1.DeploymentAvailable {
					dash.ChopCountAvailable++
					break
				}
			}
		}
	}

	// Get CHI counts
	var chis *chopv1.ClickHouseInstallationList
	chis, err = utils.GetK8s().ChopClientset.ClickhouseV1().ClickHouseInstallations("").List(
		context.TODO(), metav1.ListOptions{})
	if err == nil {
		dash.ChiCount = len(chis.Items)
		dash.ChiCountComplete = 0
		for _, chi := range chis.Items {
			if chi.Status.Status == chopv1.StatusCompleted {
				dash.ChiCountComplete++
			}
		}
	}

	_ = response.WriteEntity(dash)
}
