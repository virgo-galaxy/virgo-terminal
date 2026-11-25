package shell

import (
	"context"
	"io"
	"os/exec"
	"sync"

	"github.com/charmbracelet/x/xpty"
)

type terminal interface {
	io.ReadWriteCloser
	Resize(cols, rows int) error
}

type Session struct {
	terminal
	ctx context.Context
	cmd *exec.Cmd
	mu  sync.Mutex
}

func (s *Session) Resize(cols, rows int) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.terminal.Resize(cols, rows)
}

func (s *Session) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.terminal.Close()
}

func (s *Session) Wait() { _ = xpty.WaitProcess(s.ctx, s.cmd) }
