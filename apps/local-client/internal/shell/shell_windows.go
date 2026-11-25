package shell

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/charmbracelet/x/xpty"
)

func canRun(string) bool { return true }

func Options() []Option {
	program := os.Getenv("ComSpec")
	system := filepath.Join(os.Getenv("SystemRoot"), "System32")
	if !filepath.IsAbs(program) {
		program = filepath.Join(system, "cmd.exe")
	}
	return findOptions(program, []Option{
		{Name: "CMD", Path: "cmd.exe"}, {Name: "PowerShell 7", Path: "pwsh.exe"},
		{Name: "Windows PowerShell", Path: "powershell.exe"},
	}, system, filepath.Join(system, "WindowsPowerShell", "v1.0"), filepath.Join(os.Getenv("ProgramFiles"), "PowerShell", "7"))
}

func Start(ctx context.Context, option Option, cols, rows int) (*Session, error) {
	cmd := exec.Command(option.Path)
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
