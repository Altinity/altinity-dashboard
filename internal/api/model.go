package api

type Namespace struct {
	Name string `json:"name" description:"name of the namespace"`
}

type Pod struct {
	Name string `json:"name" description:"name of the pod"`
}

type Operator struct {
	Name string `json:"name" description:"name of the operator"`
	Version string `json:"version" description:"version of the operator"`
}

type Chi struct {
	Name      string `json:"name" description:"name of the ClickHouse instance"`
	Age       int    `json:"age" description:"age of the user" default:"21"`
}
