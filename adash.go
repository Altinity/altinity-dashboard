package main

import (
	"context"
	"crypto/rand"
	"embed"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/altinity/altinity-dashboard/internal/api"
	_ "github.com/altinity/altinity-dashboard/internal/api"
	"github.com/altinity/altinity-dashboard/internal/auth"
	"github.com/altinity/altinity-dashboard/internal/certs"
	"github.com/altinity/altinity-dashboard/internal/utils"
	restfulspec "github.com/emicklei/go-restful-openapi/v2"
	"github.com/emicklei/go-restful/v3"
	"github.com/go-openapi/spec"
	"io/fs"
	_ "k8s.io/client-go/plugin/pkg/client/auth"
	"log"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"runtime"
	"strconv"
	"time"
)

// App version info
var appVersion string
var chopRelease string

// UI embedded files
//go:embed ui/dist
var uiFiles embed.FS

// ClickHouse Operator deployment template embedded file
//go:embed embed
var embedFiles embed.FS

// openWebBrowser opens the default web browser to a given URL
func openWebBrowser(url string) {
	var err error
	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		//nolint:goerr113
		err = fmt.Errorf("unsupported platform")
	}
	if err != nil {
		log.Printf("Error opening web browser: %s\n", err)
	}
}

func main() {
	// Set up CLI parser
	cmdFlags := flag.NewFlagSet("adash", flag.ContinueOnError)
	kubeconfig := cmdFlags.String("kubeconfig", "", "path to the kubeconfig file")
	devMode := cmdFlags.Bool("devmode", false, "show Developer Tools tab")
	bindHost := cmdFlags.String("bindhost", "localhost", "host to bind to (use 0.0.0.0 for all interfaces)")
	bindPort := cmdFlags.String("bindport", "", "port to listen on")
	tlsCert := cmdFlags.String("tlscert", "", "certificate file to use to serve TLS")
	tlsKey := cmdFlags.String("tlskey", "", "private key file to use to serve TLS")
	selfSigned := cmdFlags.Bool("selfsigned", false, "run TLS using self-signed key")
	noToken := cmdFlags.Bool("notoken", false, "do not require an auth token to access the UI")
	openBrowser := cmdFlags.Bool("openbrowser", false, "open the UI in a web browser after starting")
	version := cmdFlags.Bool("version", false, "show version and exit")
	debug := cmdFlags.Bool("debug", false, "enable debug logging")

	// Parse the CLI flags
	err := cmdFlags.Parse(os.Args[1:])
	if err != nil {
		os.Exit(1)
	}

	// Read version info from embed files
	err = utils.ReadFilesToStrings(&embedFiles, []utils.FileToString{
		{Filename: "embed/version", Dest: &appVersion},
		{Filename: "embed/chop-release", Dest: &chopRelease},
	})
	if err != nil {
		fmt.Printf("Error reading version information")
		os.Exit(1)
	}

	// If version was requested, print it and exit
	if *version {
		fmt.Printf("Altinity Dashboard version %s\n", appVersion)
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

	// Enable debug logging, if requested
	if *debug {
		api.ErrorsToConsole = true
	}

	// Connect to Kubernetes
	err = utils.InitK8s(*kubeconfig)
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

	// Determine default port, if one was not specified
	if *bindPort == "" {
		var port string
		if *tlsCert != "" {
			port = "8443"
		} else {
			port = "8080"
		}
		bindPort = &port
	}

	// Read the index.html from the bundled assets and update its devmode flag
	var indexHTML []byte
	indexHTML, err = uiFiles.ReadFile("ui/dist/index.html")
	if err != nil {
		panic(err)
	}
	for name, content := range map[string]string{
		"devmode":      strconv.FormatBool(*devMode),
		"version":      appVersion,
		"chop-release": chopRelease,
	} {
		re := regexp.MustCompile(fmt.Sprintf(`meta name="%s" content="(\w*)"`, name))
		indexHTML = re.ReplaceAll(indexHTML,
			[]byte(fmt.Sprintf(`meta name="%s" content="%s"`, name, content)))
	}

	// Create HTTP router object
	httpMux := http.NewServeMux()

	// Create API handlers & docs
	rc := restful.NewContainer()
	rc.ServeMux = httpMux
	wsi := api.WebServiceInfo{
		Version:     appVersion,
		ChopRelease: chopRelease,
		Embed:       &embedFiles,
	}
	for _, resource := range []api.WebService{
		&api.DashboardResource{},
		&api.NamespaceResource{},
		&api.OperatorResource{},
		&api.ChiResource{},
	} {
		var ws *restful.WebService
		ws, err = resource.WebService(&wsi)
		if err != nil {
			fmt.Printf("Error initializing %s web service: %s\n", resource.Name(), err)
			os.Exit(1)
		}
		rc.Add(ws)
	}
	config := restfulspec.Config{
		WebServices:                   rc.RegisteredWebServices(), // you control what services are visible
		APIPath:                       "/apidocs.json",
		PostBuildSwaggerObjectHandler: enrichSwaggerObject}
	rc.Add(restfulspec.NewOpenAPIService(config))

	// Create handler for the CHI examples
	examples, err := embedFiles.ReadDir("embed/chi-examples")
	if err != nil {
		panic(err)
	}
	exampleStrings := make([]string, 0, len(examples))
	for _, ex := range examples {
		if ex.Type().IsRegular() {
			exampleStrings = append(exampleStrings, ex.Name())
		}
	}
	exampleIndex, err := json.Marshal(exampleStrings)
	if err != nil {
		panic(err)
	}
	subFilesChi, _ := fs.Sub(embedFiles, "embed/chi-examples")
	subServerChi := http.StripPrefix("/chi-examples/", http.FileServer(http.FS(subFilesChi)))
	httpMux.HandleFunc("/chi-examples/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/chi-examples/index.json" {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write(exampleIndex)
		} else {
			subServerChi.ServeHTTP(w, r)
		}
	})

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

	// Configure auth middleware
	var httpHandler http.Handler
	var authToken string
	if *noToken {
		httpHandler = httpMux
	} else {
		// Generate auth token
		randBytes := make([]byte, 256/8)
		_, err = rand.Read(randBytes)
		if err != nil {
			panic(err)
		}
		authToken = base64.RawURLEncoding.EncodeToString(randBytes)
		httpHandler = auth.NewHandler(httpMux, authToken)
	}

	// Set up the server
	bindStr := fmt.Sprintf("%s:%s", *bindHost, *bindPort)
	var authStr string
	if authToken != "" {
		authStr = fmt.Sprintf("?token=%s", authToken)
	}
	var url string
	var runServer func() error
	if *tlsCert != "" {
		url = fmt.Sprintf("https://%s%s", bindStr, authStr)
		runServer = func() error {
			return http.ListenAndServeTLS(bindStr, *tlsCert, *tlsKey, httpHandler)
		}
	} else {
		url = fmt.Sprintf("http://%s%s", bindStr, authStr)
		runServer = func() error {
			return http.ListenAndServe(bindStr, httpHandler)
		}
	}

	// Open the browser if requested and the server doesn't immediately fail
	ctx, cancel := context.WithCancel(context.Background())
	if *openBrowser {
		go func() {
			select {
			case <-ctx.Done():
				return
			case <-time.After(250 * time.Millisecond):
				openWebBrowser(url)
				return
			}
		}()
	}

	// Actually start the server
	log.Printf("Server started.  Connect using: %s\n", url)
	err = runServer()
	cancel()
	log.Fatal(err)
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
			Version: appVersion,
		},
	}
}
