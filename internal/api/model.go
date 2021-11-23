package api

type Namespace struct {
	Name string `json:"name" description:"name of the namespace"`
}

type Operator struct {
	Name       string        `json:"name" description:"name of the operator"`
	Namespace  string        `json:"namespace" description:"namespace the operator is in"`
	Conditions string        `json:"conditions" description:"conditions of the operator"`
	Version    string        `json:"version" description:"version of the operator"`
	Pods       []OperatorPod `json:"pods" description:"pods managed by the operator"`
}

type OperatorPod struct {
	Name       string              `json:"name" description:"name of the pod"`
	Status     string              `json:"status" description:"status of the pod"`
	Version    string              `json:"version" description:"version of the pod"`
	Containers []OperatorContainer `json:"containers" description:"containers in the pod"`
}

type OperatorContainer struct {
	Name  string `json:"name" description:"name of the container"`
	State string `json:"state" description:"status of the container"`
	Image string `json:"image" description:"image used by the container"`
}

type Chi struct {
	Name      string `json:"name" description:"name of the ClickHouse installation"`
	Namespace string `json:"namespace" description:"namespace the installation is in"`
	Status    string `json:"status" description:"status of the installation"`
	Clusters  int    `json:"clusters" description:"number of clusters in the installation"`
	Hosts     int    `json:"hosts" description:"number of hosts in the installation"`
}
