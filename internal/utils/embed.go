package utils

import (
	"embed"
	"fmt"
	"strings"
)

type FileToString struct {
	Filename string
	Dest     *string
}

func ReadFilesToStrings(fs *embed.FS, reqs []FileToString) error {
	for _, fts := range reqs {
		fileData, err := fs.ReadFile(fts.Filename)
		if err != nil {
			return fmt.Errorf("error reading %s: %w", fts.Filename, err)
		}
		*fts.Dest = strings.TrimSpace(string(fileData))
	}
	return nil
}
