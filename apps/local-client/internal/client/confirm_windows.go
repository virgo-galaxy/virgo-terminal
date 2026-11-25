package client

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
)

func confirmConnection(ctx context.Context, origin string) bool {
	const dialog = `
$ErrorActionPreference = 'Stop'
$dialog = New-Object -ComObject WScript.Shell
$message = 'Allow ' + $env:VIRGO_TERMINAL_ORIGIN + ' to open a Shell on this computer?'
$buttons = 4 -bor 32 -bor 256 -bor 65536 -bor 262144
if ($dialog.Popup($message, 25, 'Virgo Terminal Client', $buttons) -eq 6) { exit 0 }
exit 1`
	powershell := filepath.Join(os.Getenv("SystemRoot"), "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
	cmd := exec.CommandContext(ctx, powershell, "-NoProfile", "-NonInteractive", "-Command", dialog)
	cmd.Env = append(os.Environ(), "VIRGO_TERMINAL_ORIGIN="+origin)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	return cmd.Run() == nil
}
