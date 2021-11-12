module github.com/altinity/altinity-dashboard

go 1.16

replace github.com/altinity/altinity-dashboard => /home/graham/git/altinity-dashboard

require (
	github.com/emicklei/go-restful-openapi/v2 v2.6.0
	github.com/emicklei/go-restful/v3 v3.7.1
	github.com/go-openapi/spec v0.20.4
	k8s.io/api v0.22.3
	k8s.io/apimachinery v0.22.3
	k8s.io/client-go v0.22.3
)
