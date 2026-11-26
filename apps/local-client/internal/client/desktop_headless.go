//go:build !windows && (!darwin || !cgo)

package client

import "context"

func runDesktopClient(config desktopConfig, stop context.CancelFunc, serve func() error) error {
	return runConsoleClient(config, stop, serve)
}
