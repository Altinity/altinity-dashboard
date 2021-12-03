package api

import (
	"embed"
	"fmt"
	"github.com/emicklei/go-restful/v3"
	"log"
)

type WebServiceInfo struct {
	Version     string
	ChopRelease string
	Embed       *embed.FS
}

type WebService interface {
	Name() string
	WebService(*WebServiceInfo) (*restful.WebService, error)
}

var ErrorsToConsole bool

func webError(response *restful.Response, status int, source string, err error) {
	logErr := fmt.Errorf(fmt.Sprintf("Error %s: %v", source, err)) // nolint // dynamic errors wanted here
	if ErrorsToConsole {
		log.Printf("%s\n", logErr)
	}
	_ = response.WriteError(status, logErr)
}
