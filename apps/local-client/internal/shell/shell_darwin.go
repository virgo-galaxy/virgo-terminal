package shell

import (
	"context"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"strings"
	"time"

	"github.com/creack/pty"
)

type unixTerminal struct{ *os.File }

func (t unixTerminal) Resize(cols, rows int) error {
	return pty.Setsize(t.File, &pty.Winsize{Cols: uint16(cols), Rows: uint16(rows)})
}

func canRun(path string) bool {
	resolved, err := exec.LookPath(path)
	return err == nil && filepath.IsAbs(resolved)
}

func Options() []Option {
	return findOptions(systemShell(), []Option{
		{Name: "Zsh", Path: "zsh"}, {Name: "Bash", Path: "bash"},
		{Name: "Dash", Path: "dash"}, {Name: "Fish", Path: "fish"},
	}, "/bin", "/usr/bin", "/opt/homebrew/bin", "/usr/local/bin")
}

func systemShell() string {
	if account, err := user.Current(); err == nil {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		if output, err := exec.CommandContext(ctx, "/usr/bin/dscl", ".", "-read", "/Users/"+account.Username, "UserShell").Output(); err == nil {
			if value, ok := strings.CutPrefix(strings.TrimSpace(string(output)), "UserShell: "); ok && filepath.IsAbs(value) && canRun(value) {
				return value
			}
		}
	}
	if value := os.Getenv("SHELL"); filepath.IsAbs(value) && canRun(value) {
		return value
	}
	return "/bin/zsh"
}

func Start(ctx context.Context, option Option, cols, rows int) (*Session, error) {
	cmd := exec.CommandContext(ctx, option.Path, "-l")
	cmd.Dir, _ = os.UserHomeDir()
	cmd.Env = append(os.Environ(), "TERM=xterm-256color")
	file, err := pty.StartWithSize(cmd, &pty.Winsize{Cols: uint16(cols), Rows: uint16(rows)})
	if err != nil {
		return nil, err
	}
	return &Session{terminal: unixTerminal{file}, ctx: ctx, cmd: cmd}, nil
}
