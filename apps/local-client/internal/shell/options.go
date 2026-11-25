package shell

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type Option struct {
	Name string
	Path string
}

func findOptions(system string, candidates []Option, directories ...string) []Option {
	name := filepath.Base(system)
	for _, option := range candidates {
		if strings.EqualFold(option.Path, name) {
			name = option.Name
			break
		}
	}
	options := []Option{{Name: name, Path: system}}
	for _, option := range candidates {
		if strings.EqualFold(option.Path, filepath.Base(system)) {
			continue
		}
		if path, err := exec.LookPath(option.Path); err == nil && filepath.IsAbs(path) {
			options = append(options, Option{Name: option.Name, Path: path})
			continue
		}
		for _, directory := range directories {
			if !filepath.IsAbs(directory) {
				continue
			}
			path := filepath.Join(directory, option.Path)
			if file, err := os.Stat(path); err == nil && file.Mode().IsRegular() && canRun(path) {
				options = append(options, Option{Name: option.Name, Path: path})
				break
			}
		}
	}
	return options
}
