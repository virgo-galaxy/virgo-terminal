//go:build !darwin || !cgo

package client

import "context"

func runDesktopClient(_ string, _ context.CancelFunc, serve func() error) error {
	return serve()
}
