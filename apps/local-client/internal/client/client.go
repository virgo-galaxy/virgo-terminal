package client

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/virgo-galaxy/virgo-terminal/apps/local-client/internal/connection"
)

func Run(playground string, printURL bool) error {
	page, err := parsePlaygroundURL(playground)
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	listener, err := net.ListenTCP("tcp4", &net.TCPAddr{IP: net.IPv4(127, 0, 0, 1)})
	if err != nil {
		return fmt.Errorf("listen for browser: %w", err)
	}
	defer listener.Close()

	address := listener.Addr().(*net.TCPAddr)
	origin := page.Scheme + "://" + page.Host
	handler, key, err := connection.New(ctx, origin, address.String())
	if err != nil {
		return fmt.Errorf("create pairing: %w", err)
	}
	page.Fragment = fmt.Sprintf("connect-device=%d.%s", address.Port, key)

	server := &http.Server{Handler: handler, ReadHeaderTimeout: 5 * time.Second, MaxHeaderBytes: 16 * 1024}
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				_ = server.Close()
				return
			case <-ticker.C:
				if handler.Expired() {
					stop()
				}
			}
		}
	}()

	if printURL {
		fmt.Println(page.String())
	} else if err := openBrowser(page.String()); err != nil {
		return fmt.Errorf("open Playground: %w", err)
	}
	if err := server.Serve(listener); !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}
