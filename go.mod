module github.com/altinity/altinity-dashboard

go 1.16

require (
	github.com/altinity/clickhouse-operator v0.0.0-20211101130143-50134723c388
	github.com/emicklei/go-restful-openapi/v2 v2.9.1
	github.com/emicklei/go-restful/v3 v3.9.0
	github.com/go-openapi/spec v0.20.7
	k8s.io/api v0.23.1
	k8s.io/apimachinery v0.23.1
	k8s.io/client-go v0.23.1
	sigs.k8s.io/yaml v1.3.0
)

replace (
	github.com/altinity/altinity-dashboard => ./
	github.com/altinity/clickhouse-operator => ./clickhouse-operator/
	k8s.io/api => k8s.io/api v0.22.3
	k8s.io/apimachinery => k8s.io/apimachinery v0.22.3
	k8s.io/client-go => k8s.io/client-go v0.22.3
	k8s.io/code-generator => k8s.io/code-generator v0.22.3
)
