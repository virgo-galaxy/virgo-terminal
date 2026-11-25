package shell

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/charmbracelet/x/xpty"
)

func Start(ctx context.Context, cols, rows int) (*Session, error) {
	program := os.Getenv("ComSpec")
	if !filepath.IsAbs(program) {
		program = filepath.Join(os.Getenv("SystemRoot"), "System32", "cmd.exe")
	}
	cmd := exec.Command(program)
	cmd.Dir, _ = os.UserHomeDir()
	terminal, err := xpty.NewConPty(cols, rows)
	if err != nil {
		return nil, err
	}
	if err := terminal.Start(cmd); err != nil {
		_ = terminal.Close()
		return nil, err
	}
	return &Session{terminal: terminal, ctx: ctx, cmd: cmd}, nil
}
