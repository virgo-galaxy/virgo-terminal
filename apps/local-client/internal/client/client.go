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

const connectionPort = 43127 // Keep in sync with the Playground's device port.

func Run(playground string, printURL bool) error {
	page, err := parsePlaygroundURL(playground)
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	port := connectionPort
	approve := confirmConnection
	if printURL {
		port = 0
		approve = nil
	}
	listener, err := net.ListenTCP("tcp4", &net.TCPAddr{IP: net.IPv4(127, 0, 0, 1), Port: port})
	if err != nil {
		return fmt.Errorf("listen for browser: %w", err)
	}
	defer listener.Close()

	address := listener.Addr().(*net.TCPAddr)
	origin := page.Scheme + "://" + page.Host
	handler, key, err := connection.New(ctx, origin, address.String(), approve)
	if err != nil {
		return fmt.Errorf("create pairing: %w", err)
	}
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
		page.Fragment = fmt.Sprintf("connect-device=%d.%s", address.Port, key)
		fmt.Println(page.String())
	} else {
		fmt.Printf("Waiting for a connection from %s\n", origin)
	}
	if err := server.Serve(listener); !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}
