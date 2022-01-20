package main

import (
	"embed"
	"flag"
	"fmt"
	_ "github.com/altinity/altinity-dashboard/internal/api"
	"github.com/altinity/altinity-dashboard/internal/server"
	"github.com/altinity/altinity-dashboard/internal/utils"
	_ "k8s.io/client-go/plugin/pkg/client/auth"
	"log"
	"os"
	"os/exec"
	"runtime"
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

	// Start the server
	c := server.Config{
		TLSCert:     *tlsCert,
		TLSKey:      *tlsKey,
		SelfSigned:  *selfSigned,
		Debug:       *debug,
		Kubeconfig:  *kubeconfig,
		BindHost:    *bindHost,
		BindPort:    *bindPort,
		DevMode:     *devMode,
		NoToken:     *noToken,
		AppVersion:  appVersion,
		ChopRelease: chopRelease,
		UIFiles:     &uiFiles,
		EmbedFiles:  &embedFiles,
	}
	err = c.RunServer()
	if err != nil {
		log.Fatalf("Error: %s", err)
	}
	log.Printf("Server started.  Connect using: %s\n", c.URL)
	if *openBrowser {
		openWebBrowser(c.URL)
	}
	<-c.Context.Done()
	log.Fatalf("Error: %s", c.ServerError)
}
