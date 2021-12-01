package api

import (
	"embed"
	"fmt"
	"github.com/emicklei/go-restful/v3"
	"log"
	"strings"
)

type WebServiceInfo struct {
	Embed *embed.FS
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

type FileToString struct {
	Filename string
	Dest     *string
}

func readFilesToStrings(fs *embed.FS, reqs []FileToString) error {
	for _, fts := range reqs {
		fileData, err := fs.ReadFile(fts.Filename)
		if err != nil {
			return fmt.Errorf("error reading %s: %w", fts.Filename, err)
		}
		*fts.Dest = strings.TrimSpace(string(fileData))
	}
	return nil
}
