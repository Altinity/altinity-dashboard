package api

import (
	"fmt"
	"github.com/emicklei/go-restful/v3"
	"log"
)

var ErrorsToConsole bool

func webError(response *restful.Response, status int, source string, err error) {
	logErr := fmt.Errorf(fmt.Sprintf("Error %s: %v", source, err))  // nolint // dynamic errors wanted here
	if ErrorsToConsole {
		log.Printf("%s\n", logErr)
	}
	_ = response.WriteError(status, logErr)
}
