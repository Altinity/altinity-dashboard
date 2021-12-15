package server

import (
	"context"
	"crypto/rand"
	"embed"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/altinity/altinity-dashboard/internal/api"
	"github.com/altinity/altinity-dashboard/internal/certs"
	"github.com/altinity/altinity-dashboard/internal/utils"
	restfulspec "github.com/emicklei/go-restful-openapi/v2"
	"github.com/emicklei/go-restful/v3"
	"github.com/go-openapi/spec"
	"io/fs"
	"net/http"
	"regexp"
	"strconv"
	"time"
)

type Config struct {
	TLSCert     string
	TLSKey      string
	SelfSigned  bool
	Debug       bool
	Kubeconfig  string
	BindHost    string
	BindPort    string
	DevMode     bool
	NoToken     bool
	AppVersion  string
	ChopRelease string
	UIFiles     *embed.FS
	EmbedFiles  *embed.FS
	URL         string
	ServerError error
}

var ErrTLSCertKeyBothOrNeither = errors.New("TLS cert and key must both be provided or neither")
var ErrTLSOrSelfSigned = errors.New("cannot provide TLS certificate and also run self-signed")

func (c *Config) RunServer() (context.Context, error) {
	// Check CLI flags for correctness
	if (c.TLSCert == "") != (c.TLSKey == "") {
		return nil, ErrTLSCertKeyBothOrNeither
	}
	if (c.SelfSigned) && (c.TLSCert != "") {
		return nil, ErrTLSOrSelfSigned
	}

	// Enable debug logging, if requested
	if c.Debug {
		api.ErrorsToConsole = true
	}

	// Connect to Kubernetes
	err := utils.InitK8s(c.Kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("could not connect to Kubernetes: %w", err)
	}

	// If self-signed, generate the certificates
	if c.SelfSigned {
		c.TLSCert, c.TLSKey, err = certs.GenerateSelfSignedCerts(true)
		if err != nil {
			return nil, fmt.Errorf("error generating self-signed certificate: %w", err)
		}
	}

	// Determine default port, if one was not specified
	if c.BindPort == "" {
		if c.TLSCert != "" {
			c.BindPort = "8443"
		} else {
			c.BindPort = "8080"
		}
	}

	// Read the index.html from the bundled assets and update its devmode flag
	var indexHTML []byte
	indexHTML, err = c.UIFiles.ReadFile("ui/dist/index.html")
	if err != nil {
		return nil, fmt.Errorf("error reading embedded UI files: %w", err)
	}
	for name, content := range map[string]string{
		"devmode":      strconv.FormatBool(c.DevMode),
		"version":      c.AppVersion,
		"chop-release": c.ChopRelease,
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
		Version:     c.AppVersion,
		ChopRelease: c.ChopRelease,
		Embed:       c.EmbedFiles,
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
			return nil, fmt.Errorf("error initializing %s web service: %w", resource.Name(), err)
		}
		rc.Add(ws)
	}
	config := restfulspec.Config{
		WebServices:                   rc.RegisteredWebServices(), // you control what services are visible
		APIPath:                       "/apidocs.json",
		PostBuildSwaggerObjectHandler: c.enrichSwaggerObject}
	rc.Add(restfulspec.NewOpenAPIService(config))

	// Create handler for the CHI examples
	examples, err := c.EmbedFiles.ReadDir("embed/chi-examples")
	if err != nil {
		return nil, fmt.Errorf("error reading embedded examples: %w", err)
	}
	exampleStrings := make([]string, 0, len(examples))
	for _, ex := range examples {
		if ex.Type().IsRegular() {
			exampleStrings = append(exampleStrings, ex.Name())
		}
	}
	exampleIndex, err := json.Marshal(exampleStrings)
	if err != nil {
		return nil, fmt.Errorf("error reading example index JSON: %w", err)
	}
	subFilesChi, _ := fs.Sub(c.EmbedFiles, "embed/chi-examples")
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
	subFiles, _ := fs.Sub(c.UIFiles, "ui/dist")
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
	if c.NoToken {
		httpHandler = httpMux
	} else {
		// Generate auth token
		randBytes := make([]byte, 256/8)
		_, err = rand.Read(randBytes)
		if err != nil {
			return nil, fmt.Errorf("error generating random number: %w", err)
		}
		authToken = base64.RawURLEncoding.EncodeToString(randBytes)
		httpHandler = NewHandler(httpMux, authToken)
	}

	// Set up the server
	bindStr := fmt.Sprintf("%s:%s", c.BindHost, c.BindPort)
	var authStr string
	if authToken != "" {
		authStr = fmt.Sprintf("?token=%s", authToken)
	}
	var runServer func() error
	if c.TLSCert != "" {
		c.URL = fmt.Sprintf("https://%s%s", bindStr, authStr)
		runServer = func() error {
			return http.ListenAndServeTLS(bindStr, c.TLSCert, c.TLSKey, httpHandler)
		}
	} else {
		c.URL = fmt.Sprintf("http://%s%s", bindStr, authStr)
		runServer = func() error {
			return http.ListenAndServe(bindStr, httpHandler)
		}
	}

	// Start the server, but capture errors if it immediately fails to start
	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		c.ServerError = runServer()
		cancel()
	}()

	select {
	case <-ctx.Done():
		return nil, c.ServerError
	case <-time.After(250 * time.Millisecond):
		return ctx, nil
	}
}

func (c *Config) enrichSwaggerObject(swo *spec.Swagger) {
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
			Version: c.AppVersion,
		},
	}
}
