package client

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"syscall"

	"golang.org/x/sys/windows"
)

func confirmConnection(ctx context.Context, origin string, remember bool) bool {
	const dialog = `
$ErrorActionPreference = 'Stop'
$dialog = New-Object -ComObject WScript.Shell
$message = 'Allow ' + $env:VIRGO_TERMINAL_ORIGIN + ' to open a Shell on this computer?'
if ($env:VIRGO_TERMINAL_REMEMBER -eq 'true') { $message += [Environment]::NewLine + 'This browser will be remembered.' }
$buttons = 4 -bor 32 -bor 256 -bor 65536 -bor 262144
if ($dialog.Popup($message, 25, 'Virgo Terminal Client', $buttons) -eq 6) { exit 0 }
exit 1`
	powershell := filepath.Join(os.Getenv("SystemRoot"), "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
	cmd := exec.CommandContext(ctx, powershell, "-NoProfile", "-NonInteractive", "-Command", dialog)
	cmd.Env = append(os.Environ(), "VIRGO_TERMINAL_ORIGIN="+origin, "VIRGO_TERMINAL_REMEMBER="+strconv.FormatBool(remember))
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: windows.CREATE_NO_WINDOW}
	return cmd.Run() == nil
}
