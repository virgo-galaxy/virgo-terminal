package connection

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/virgo-galaxy/virgo-terminal/apps/local-client/internal/shell"
)

func TestDesktopConnectionRequiresClientAction(t *testing.T) {
	const origin = "https://terminal.virgogalaxy.com"
	const address = "127.0.0.1:43127"
	desktop := &DesktopSession{}
	server := &Server{ctx: context.Background(), origin: origin, address: address, options: Options{Desktop: desktop}}
	request := httptest.NewRequest(http.MethodGet, "http://"+address+"/local-shell", nil)
	request.Header.Set("Origin", origin)
	response := httptest.NewRecorder()
	server.ServeHTTP(response, request)
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("before clicking Connect: got status %d", response.Code)
	}

	selected := shell.Option{Name: "Bash", Path: "/bin/bash"}
	if !desktop.Connect(selected, true) {
		t.Fatal("could not arm desktop connection")
	}
	request.Header.Set("Origin", "https://another.example.com")
	response = httptest.NewRecorder()
	server.ServeHTTP(response, request)
	if response.Code != http.StatusForbidden {
		t.Fatalf("unexpected origin: got status %d", response.Code)
	}
	if option, remember, ok := desktop.claim(); !ok || option != selected || !remember {
		t.Fatalf("connection lost the selected Shell or remember setting: %v, %t, %t", option, remember, ok)
	}
	if _, _, ok := desktop.claim(); ok {
		t.Fatal("a second tab claimed the same connection")
	}
	desktop.finish()
	if _, _, ok := desktop.claim(); ok {
		t.Fatal("a finished session reopened without another click")
	}
}

func TestBrowserTrustSurvivesClientRestart(t *testing.T) {
	path := filepath.Join(t.TempDir(), "trusted-browser")
	trust := &BrowserTrust{path: path}
	key := strings.Repeat("a", 64)
	if trust.Matches(key) {
		t.Fatal("browser was trusted before approval")
	}
	if err := trust.Remember(key); err != nil {
		t.Fatal(err)
	}
	digest, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	restarted := &BrowserTrust{path: path, digest: digest}
	if !restarted.Matches(key) || restarted.Matches(strings.Repeat("b", 64)) {
		t.Fatal("saved approval did not stay with the original browser")
	}
	if err := restarted.Forget(); err != nil {
		t.Fatal(err)
	}
	if restarted.Matches(key) {
		t.Fatal("browser stayed trusted after forgetting it")
	}
}
