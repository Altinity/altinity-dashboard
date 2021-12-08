package api

import (
	"embed"
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

func webError(response *restful.Response, status int, err error) {
	if ErrorsToConsole {
		log.Printf("%s\n", err)
	}
	_ = response.WriteError(status, err)
}
