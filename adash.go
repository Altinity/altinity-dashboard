package main

import (
	"embed"
	"flag"
	api "github.com/altinity/altinity-dashboard/internal/api"
	"github.com/altinity/altinity-dashboard/internal/k8s"
	restfulspec "github.com/emicklei/go-restful-openapi/v2"
	restful "github.com/emicklei/go-restful/v3"
	"github.com/go-openapi/spec"
	"io/fs"
	"k8s.io/client-go/util/homedir"
	"log"
	"net/http"
	"path/filepath"
)

// UI embedded files
//go:embed ui/dist
var uiFiles embed.FS

// Swagger UI embedded files
//go:embed swagger-ui-dist
var swaggerFiles embed.FS

func main() {

	var kubeconfig *string
	if home := homedir.HomeDir(); home != "" {
		kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(optional) absolute path to the kubeconfig file")
	} else {
		kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
	}
	flag.Parse()
	k8s.InitK8s(*kubeconfig)

	restful.DefaultContainer.Add(api.PodResource{}.WebService())

	config := restfulspec.Config{
		WebServices:                   restful.RegisteredWebServices(), // you control what services are visible
		APIPath:                       "/apidocs.json",
		PostBuildSwaggerObjectHandler: enrichSwaggerObject}
	restful.DefaultContainer.Add(restfulspec.NewOpenAPIService(config))

	// Serve the UI assets
	subFiles, _ := fs.Sub(uiFiles, "ui/dist")
	http.Handle("/", http.FileServer(http.FS(subFiles)))

	// Provide Swagger UI for easy browser access to the API
	swaggerSubFiles, _ := fs.Sub(swaggerFiles, "swagger-ui-dist")
	http.Handle("/apidocs/", http.StripPrefix("/apidocs/", http.FileServer(http.FS(swaggerSubFiles))))

	// Redirect to the Swagger UI if someone opens the root in the browser
	// http.Handle("/", http.RedirectHandler("/apidocs/?url=/apidocs.json", 302))

	log.Printf("start listening on localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func enrichSwaggerObject(swo *spec.Swagger) {
	swo.Info = &spec.Info{
		InfoProps: spec.InfoProps{
			Title:       "Altinity Dashboard",
			Contact: &spec.ContactInfo{
				ContactInfoProps: spec.ContactInfoProps{
					Name:  "Altinity",
					Email: "info@altinity.com",
					URL:   "https://altinity.com",
				},
			},
			License: &spec.License{
				LicenseProps: spec.LicenseProps{
					Name: "Apache-2.0",
					URL:  "https://www.apache.org/licenses/LICENSE-2.0",
				},
			},
			Version: "0.1.0",
		},
	}
}
