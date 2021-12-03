package utils

import (
	"bufio"
	"errors"
	"io"
	utilyaml "k8s.io/apimachinery/pkg/util/yaml"
	"strings"
)

func SplitYAMLDocs(yaml string) ([]string, error) {
	multiDocReader := utilyaml.NewYAMLReader(bufio.NewReader(strings.NewReader(yaml)))
	yamlDocs := make([]string, 0)
	for {
		yd, err := multiDocReader.Read()
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			} else {
				return nil, err
			}
		}
		yamlDocs = append(yamlDocs, string(yd))
	}
	return yamlDocs, nil
}
