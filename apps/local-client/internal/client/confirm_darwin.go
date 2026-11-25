package client

import (
	"context"
	"os/exec"
	"strings"
)

func confirmConnection(ctx context.Context, origin string) bool {
	const dialog = `on run argv
	activate
	set dialogText to "Allow " & (item 1 of argv) & " to open a Shell on this Mac?"
	set dialogResult to display dialog dialogText with title "Virgo Terminal Client" buttons {"Cancel", "Allow"} default button "Cancel" cancel button "Cancel" with icon caution giving up after 25
	if gave up of dialogResult then return ""
	return button returned of dialogResult
end run`
	output, err := exec.CommandContext(ctx, "/usr/bin/osascript", "-e", dialog, "--", origin).Output()
	return err == nil && strings.TrimSpace(string(output)) == "Allow"
}
