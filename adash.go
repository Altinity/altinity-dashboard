package main

import (
	"embed"
	"flag"
	"fmt"
	_ "github.com/altinity/altinity-dashboard/internal/api"
	"github.com/altinity/altinity-dashboard/internal/k8s"
	restfulspec "github.com/emicklei/go-restful-openapi/v2"
	restful "github.com/emicklei/go-restful/v3"
	"github.com/go-openapi/spec"
	"io/fs"
	_ "k8s.io/client-go/plugin/pkg/client/auth"
	"log"
	"net/http"
	"os"
	"regexp"
	"strconv"
)

// UI embedded files
//go:embed ui/dist
var uiFiles embed.FS

func main() {

	cmdFlags := flag.NewFlagSet("adash", flag.ContinueOnError)

	kubeconfig := cmdFlags.String("kubeconfig", "", "path to the kubeconfig file")
	devMode := cmdFlags.Bool("devmode", false, "show Developer Tools tab")

	err := cmdFlags.Parse(os.Args[1:])
	if err != nil {
		os.Exit(1)
	}

	err = k8s.InitK8s(*kubeconfig)
	if err != nil {
		fmt.Printf("Could not connect to Kubernetes: %s\n", err)
		os.Exit(1)
	}

	config := restfulspec.Config{
		WebServices:                   restful.RegisteredWebServices(), // you control what services are visible
		APIPath:                       "/apidocs.json",
		PostBuildSwaggerObjectHandler: enrichSwaggerObject}
	restful.DefaultContainer.Add(restfulspec.NewOpenAPIService(config))

	indexHtmlOrig, err := uiFiles.ReadFile("ui/dist/index.html")
	if err != nil {
		panic(err)
	}

	indexRegex := regexp.MustCompile(`meta name="devmode" content="(\w+)"`)
	indexHtml := indexRegex.ReplaceAll(indexHtmlOrig, []byte(`meta name="devmode" content="` +
		strconv.FormatBool(*devMode) + `"`))

	// Create FileServer for the UI assets
	subFiles, _ := fs.Sub(uiFiles, "ui/dist")
	subServer := http.FileServer(http.FS(subFiles))

	// Handle requests
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if (r.URL.Path == "/") || (r.URL.Path == "/index.html") {
			_, _ = w.Write(indexHtml)
		} else {
			subServer.ServeHTTP(w, r)
		}
	})

	// Start the server
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
