package connection

import (
	"context"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
	"github.com/virgo-galaxy/virgo-terminal/apps/local-client/internal/shell"
)

const protocol = "virgo-terminal.v1"

type Server struct {
	ctx     context.Context
	origin  string
	address string
	pairing *pairing
}

func New(ctx context.Context, origin, address string) (*Server, string, error) {
	pairing, err := newPairing()
	if err != nil {
		return nil, "", err
	}
	return &Server{ctx: ctx, origin: origin, address: address, pairing: pairing}, pairing.launch, nil
}

func (s *Server) Expired() bool { return s.pairing.expired() }

type message struct {
	Type string `json:"type"`
	Key  string `json:"key"`
	Data string `json:"data"`
	Cols int    `json:"cols"`
	Rows int    `json:"rows"`
}

func (m message) validSize() bool {
	return m.Cols >= 2 && m.Cols <= 1000 && m.Rows >= 1 && m.Rows <= 1000
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/local-shell" {
		http.NotFound(w, r)
		return
	}
	if r.Host != s.address || r.Header.Get("Origin") != s.origin {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// The exact origin and host were checked above, including their ports.
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		Subprotocols:       []string{protocol},
		InsecureSkipVerify: true,
	})
	if err != nil {
		return
	}
	defer conn.CloseNow()
	conn.SetReadLimit(1024 * 1024)
	if conn.Subprotocol() != protocol {
		_ = conn.Close(websocket.StatusPolicyViolation, "Unsupported protocol")
		return
	}

	var start message
	startCtx, stopStart := context.WithTimeout(s.ctx, 10*time.Second)
	err = wsjson.Read(startCtx, conn, &start)
	stopStart()
	if err != nil || start.Type != "start" || !start.validSize() || !s.pairing.claim(start.Key) {
		_ = conn.Close(websocket.StatusPolicyViolation, "Invalid pairing or terminal size")
		return
	}
	defer s.pairing.release()

	ctx, stop := context.WithCancel(s.ctx)
	defer stop()
	terminal, err := shell.Start(ctx, start.Cols, start.Rows)
	if err != nil {
		log.Printf("Start shell: %v", err)
		_ = conn.Close(websocket.StatusInternalError, "Could not start shell")
		return
	}
	processDone := make(chan struct{})
	go func() {
		terminal.Wait()
		close(processDone)
	}()
	defer func() {
		stop()
		_ = terminal.Close()
		<-processDone
	}()

	readyCtx, stopReady := context.WithTimeout(ctx, 10*time.Second)
	err = wsjson.Write(readyCtx, conn, message{Type: "ready", Key: s.pairing.session})
	stopReady()
	if err != nil {
		return
	}
	s.pairing.complete()

	inputDone := make(chan struct{})
	go func() {
		sendInput(ctx, conn, terminal)
		close(inputDone)
	}()
	outputDone := make(chan struct{})
	go func() {
		sendOutput(ctx, conn, terminal)
		close(outputDone)
	}()

	select {
	case <-ctx.Done():
		return
	case <-inputDone:
		return
	case <-outputDone:
	case <-processDone:
		// Allow final output to drain. ConPTY may keep its output pipe open
		// after the child process exits.
		select {
		case <-outputDone:
		case <-inputDone:
			return
		case <-ctx.Done():
			return
		case <-time.After(250 * time.Millisecond):
		}
	}
	_ = conn.Close(websocket.StatusNormalClosure, "Shell exited")
}

func sendInput(ctx context.Context, conn *websocket.Conn, terminal *shell.Session) {
	for {
		var next message
		if err := wsjson.Read(ctx, conn, &next); err != nil {
			return
		}
		switch next.Type {
		case "input":
			if _, err := io.WriteString(terminal, next.Data); err != nil {
				return
			}
		case "resize":
			if next.validSize() {
				_ = terminal.Resize(next.Cols, next.Rows)
			}
		}
	}
}

func sendOutput(ctx context.Context, conn *websocket.Conn, terminal io.Reader) {
	buffer := make([]byte, 32*1024)
	for {
		count, err := terminal.Read(buffer)
		if count > 0 {
			writeCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
			writeErr := conn.Write(writeCtx, websocket.MessageBinary, buffer[:count])
			cancel()
			if writeErr != nil {
				return
			}
		}
		if err != nil {
			return
		}
	}
}
