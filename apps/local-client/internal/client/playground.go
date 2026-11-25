package client

import (
	"errors"
	"net/url"
	"strings"
)

func parsePlaygroundURL(rawURL string) (*url.URL, error) {
	page, err := url.Parse(rawURL)
	if err != nil || page.Hostname() == "" || page.User != nil ||
		(page.Scheme != "https" && !(page.Scheme == "http" && page.Hostname() == "127.0.0.1")) {
		return nil, errors.New("Playground must have an HTTPS or local 127.0.0.1 URL")
	}

	// The browser omits default ports from its WebSocket Origin header.
	port := page.Port()
	if port == "" || (page.Scheme == "https" && port == "443") || (page.Scheme == "http" && port == "80") {
		page.Host = strings.TrimSuffix(page.Host, ":"+port)
	}
	page.Host = strings.ToLower(page.Host)
	return page, nil
}
