// +build dev

package dev_server

import (
	"embed"
	"io/fs"
	"net/http"
)

// Swagger UI embedded files
//go:embed swagger-ui-dist
var swaggerFiles embed.FS

func AddDevEndpoints() {
	// Provide Swagger UI for easy browser access to the API
	swaggerSubFiles, _ := fs.Sub(swaggerFiles, "swagger-ui-dist")
	http.Handle("/apidocs/", http.StripPrefix("/apidocs/", http.FileServer(http.FS(swaggerSubFiles))))
}
