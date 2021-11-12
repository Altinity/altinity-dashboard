package api

type Namespace struct {
	Name string `json:"name" description:"name of the namespace"`
}

type Pod struct {
	Name string `json:"name" description:"name of the pod"`
	Namespace string `json:"namespace" description:"namespace the pod is in"`
}

type Operator struct {
	Name string `json:"name" description:"name of the operator"`
	Namespace string `json:"namespace" description:"namespace the operator is in"`
	Status string `json:"status" description:"status of the operator pod"`
	Version string `json:"version" description:"version of the operator"`
}

type Chi struct {
	Name      string `json:"name" description:"name of the ClickHouse installation"`
	Namespace string `json:"namespace" description:"namespace the installation is in"`
	Status string `json:"status" description:"status of the installation"`
	Clusters int `json:"clusters" description:"number of clusters in the installation"`
	Hosts int `json:"hosts" description:"number of hosts in the installation"`
}
