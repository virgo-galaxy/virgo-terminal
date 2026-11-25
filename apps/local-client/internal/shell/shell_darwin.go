package shell

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/creack/pty"
)

type unixTerminal struct{ *os.File }

func (t unixTerminal) Resize(cols, rows int) error {
	return pty.Setsize(t.File, &pty.Winsize{Cols: uint16(cols), Rows: uint16(rows)})
}

func Start(ctx context.Context, cols, rows int) (*Session, error) {
	program := os.Getenv("SHELL")
	if !filepath.IsAbs(program) {
		program = "/bin/zsh"
	}
	cmd := exec.CommandContext(ctx, program, "-l")
	cmd.Dir, _ = os.UserHomeDir()
	cmd.Env = append(os.Environ(), "TERM=xterm-256color")
	file, err := pty.StartWithSize(cmd, &pty.Winsize{Cols: uint16(cols), Rows: uint16(rows)})
	if err != nil {
		return nil, err
	}
	return &Session{terminal: unixTerminal{file}, ctx: ctx, cmd: cmd}, nil
}
