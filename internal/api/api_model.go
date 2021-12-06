package api

type Namespace struct {
	Name string `json:"name" description:"name of the namespace"`
}

type Pod struct {
	Name       string      `json:"name" description:"name of the pod"`
	Status     string      `json:"status" description:"status of the pod"`
	Containers []Container `json:"containers" description:"containers in the pod"`
}

type Container struct {
	Name  string `json:"name" description:"name of the container"`
	State string `json:"state" description:"status of the container"`
	Image string `json:"image" description:"image used by the container"`
}

type Operator struct {
	Name       string        `json:"name" description:"name of the operator"`
	Namespace  string        `json:"namespace" description:"namespace the operator is in"`
	Conditions string        `json:"conditions" description:"conditions of the operator"`
	Version    string        `json:"version" description:"version of the operator"`
	ConfigYaml string        `json:"config_yaml" description:"operator config as a YAML string"`
	Pods       []OperatorPod `json:"pods" description:"pods managed by the operator"`
}

type OperatorPod struct {
	Pod
	Version string `json:"version" description:"version of the pod"`
}

type ResourceSpecMetadata struct {
	Name            string `json:"name"`
	Namespace       string `json:"namespace"`
	ResourceVersion string `json:"resourceVersion"`
}

type ResourceSpec struct {
	APIVersion string               `json:"apiVersion"`
	Kind       string               `json:"kind"`
	Metadata   ResourceSpecMetadata `json:"metadata"`
	Spec       interface{}          `json:"spec"`
}

type Chi struct {
	Name          string         `json:"name" description:"name of the ClickHouse installation"`
	Namespace     string         `json:"namespace" description:"namespace the installation is in"`
	Status        string         `json:"status" description:"status of the installation"`
	Clusters      int            `json:"clusters" description:"number of clusters in the installation"`
	Hosts         int            `json:"hosts" description:"number of hosts in the installation"`
	ExternalURL   string         `json:"external_url" description:"external URL of the loadbalancer service"`
	ResourceYAML  string         `json:"resource_yaml" description:"Kubernetes YAML spec of the CHI resource"`
	CHClusterPods []CHClusterPod `json:"ch_cluster_pods" description:"ClickHouse cluster pods"`
}

type CHClusterPod struct {
	Pod
	ClusterName string `json:"cluster_name" description:"name of the ClickHouse cluster"`
}

type Dashboard struct {
	KubeCluster        string `json:"kube_cluster" description:"kubernetes cluster name"`
	KubeVersion        string `json:"kube_version" description:"kubernetes cluster version"`
	ChopCount          int    `json:"chop_count" description:"number of clickhouse-operators deployed"`
	ChopCountAvailable int    `json:"chop_count_available" description:"number of clickhouse-operators available"`
	ChiCount           int    `json:"chi_count" description:"number of ClickHouse Installations deployed"`
	ChiCountComplete   int    `json:"chi_count_complete" description:"number of ClickHouse Installations completed"`
}
