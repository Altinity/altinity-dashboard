package main

import (
	"bytes"
	"embed"
	"flag"
	"fmt"
	"github.com/altinity/altinity-dashboard/internal/api"
	_ "github.com/altinity/altinity-dashboard/internal/api"
	"github.com/altinity/altinity-dashboard/internal/certs"
	"github.com/altinity/altinity-dashboard/internal/k8s"
	restfulspec "github.com/emicklei/go-restful-openapi/v2"
	"github.com/emicklei/go-restful/v3"
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

// ClickHouse Operator deployment template embedded file
//go:embed embed
var embedFiles embed.FS

func main() {
	// Set up CLI parser
	cmdFlags := flag.NewFlagSet("adash", flag.ContinueOnError)
	kubeconfig := cmdFlags.String("kubeconfig", "", "path to the kubeconfig file")
	devMode := cmdFlags.Bool("devmode", false, "show Developer Tools tab")
	bindHost := cmdFlags.String("bindhost", "localhost", "host to bind to (use 0.0.0.0 for all interfaces)")
	bindPort := cmdFlags.String("bindport", "8080", "port to listen on")
	tlsCert := cmdFlags.String("tlscert", "", "certificate file to use to serve TLS")
	tlsKey := cmdFlags.String("tlskey", "", "private key file to use to serve TLS")
	selfSigned := cmdFlags.Bool("selfsigned", false, "run TLS using self-signed key")
	version := cmdFlags.Bool("version", false, "show version and exit")

	// Parse the CLI flags
	err := cmdFlags.Parse(os.Args[1:])
	if err != nil {
		os.Exit(1)
	}

	// If version was requested, print it and exit
	if *version {
		var verInfo []byte
		var chopRelease []byte
		verInfo, err = embedFiles.ReadFile("embed/version")
		if err == nil {
			chopRelease, err = embedFiles.ReadFile("embed/chop-release")
		}
		if err != nil {
			fmt.Printf("Error reading version information")
			os.Exit(1)
		}
		verInfo = bytes.TrimSpace(verInfo)
		chopRelease = bytes.TrimSpace(chopRelease)
		fmt.Printf("Altinity Dashboard version %s\n", verInfo)
		fmt.Printf("   built using clickhouse-operator version %s\n", chopRelease)
		os.Exit(0)
	}

	// Check CLI flags for correctness
	if (*tlsCert == "") != (*tlsKey == "") {
		fmt.Printf("TLS cert and key must both be provided or neither")
		os.Exit(1)
	}
	if (*selfSigned) && (*tlsCert != "") {
		fmt.Printf("Cannot provide TLS certificate and also run self-signed")
		os.Exit(1)
	}

	// Connect to Kubernetes
	err = k8s.InitK8s(*kubeconfig)
	if err != nil {
		fmt.Printf("Could not connect to Kubernetes: %s\n", err)
		os.Exit(1)
	}

	// If self-signed, generate the certificates
	if *selfSigned {
		cert, key, err := certs.GenerateSelfSignedCerts(true)
		if err != nil {
			fmt.Printf("Error generating self-signed certificate: %s\n", err)
			os.Exit(1)
		}
		tlsCert = &cert
		tlsKey = &key
	}

	// Read the index.html from the bundled assets and set its devmode flag
	indexHTMLOrig, err := uiFiles.ReadFile("ui/dist/index.html")
	if err != nil {
		panic(err)
	}
	indexHTML := regexp.MustCompile(`meta name="devmode" content="(\w+)"`).
		ReplaceAll(indexHTMLOrig, []byte(`meta name="devmode" content="`+
			strconv.FormatBool(*devMode)+`"`))

	// Create HTTP router object
	httpMux := http.NewServeMux()

	// Create Swagger-compatible API docs resource
	rc := restful.NewContainer()
	rc.ServeMux = httpMux
	rc.Add((&api.NamespaceResource{}).WebService())
	var ows *restful.WebService
	ows, err = (&api.OperatorResource{}).WebService(&embedFiles)
	if err != nil {
		fmt.Printf("Error initializing operator web service: %s\n", err)
		os.Exit(1)
	}
	rc.Add(ows)
	rc.Add((&api.ChiResource{}).WebService())
	config := restfulspec.Config{
		WebServices:                   rc.RegisteredWebServices(), // you control what services are visible
		APIPath:                       "/apidocs.json",
		PostBuildSwaggerObjectHandler: enrichSwaggerObject}
	rc.Add(restfulspec.NewOpenAPIService(config))

	// Create handler for the UI assets
	subFiles, _ := fs.Sub(uiFiles, "ui/dist")
	subServer := http.FileServer(http.FS(subFiles))
	httpMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if (r.URL.Path == "/") ||
			(r.URL.Path == "/index.html") ||
			(r.URL.Path == "/operators") ||
			(r.URL.Path == "/chis") ||
			(r.URL.Path == "/devel") {
			_, _ = w.Write(indexHTML)
		} else {
			subServer.ServeHTTP(w, r)
		}
	})

	// Create handler for the CHI examples
	subFilesChi, _ := fs.Sub(uiFiles, "embed/chi-examples")
	subServerChi := http.FileServer(http.FS(subFilesChi))
	httpMux.Handle("/chi-examples", subServerChi)

	// Start the server
	bindStr := fmt.Sprintf("%s:%s", *bindHost, *bindPort)
	if *tlsCert != "" {
		log.Printf("start listening on https://%s", bindStr)
		log.Fatal(http.ListenAndServeTLS(bindStr, *tlsCert, *tlsKey, httpMux))
	} else {
		log.Printf("start listening on http://%s", bindStr)
		log.Fatal(http.ListenAndServe(bindStr, httpMux))
	}
}

func enrichSwaggerObject(swo *spec.Swagger) {
	swo.Info = &spec.Info{
		InfoProps: spec.InfoProps{
			Title: "Altinity Dashboard",
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
