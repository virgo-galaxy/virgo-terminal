package client

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/virgo-galaxy/virgo-terminal/apps/local-client/internal/connection"
	"github.com/virgo-galaxy/virgo-terminal/apps/local-client/internal/shell"
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
	if printURL {
		port = 0
	}
	listener, err := net.ListenTCP("tcp4", &net.TCPAddr{IP: net.IPv4(127, 0, 0, 1), Port: port})
	if err != nil {
		return fmt.Errorf("listen for browser: %w", err)
	}
	defer listener.Close()

	address := listener.Addr().(*net.TCPAddr)
	origin := page.Scheme + "://" + page.Host
	shells := shell.Options()
	options := connection.Options{DefaultShell: shells[0]}
	if !printURL {
		trust, err := connection.NewBrowserTrust(origin)
		if err != nil {
			log.Printf("Read browser authorization: %v", err)
		}
		options.Desktop = &connection.DesktopSession{}
		options.Trust = trust
		options.Approve = confirmConnection
	}
	handler, key, err := connection.New(ctx, origin, address.String(), options)
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
	serve := func() error {
		err := server.Serve(listener)
		stop()
		handler.Wait()
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
	if printURL {
		page.Fragment = fmt.Sprintf("connect-device=%d.%s", address.Port, key)
		fmt.Println(page.String())
		return serve()
	}
	query := page.Query()
	query.Set("view", "connect-device")
	page.RawQuery = query.Encode()
	return runDesktopClient(desktopConfig{
		playgroundURL: page.String(),
		shells:        shells,
		session:       options.Desktop,
		trust:         options.Trust,
	}, stop, serve)
}
