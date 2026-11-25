package client

import (
	"context"
	"os/exec"
	"strconv"
	"strings"
)

func confirmConnection(ctx context.Context, origin string, remember bool) bool {
	const dialog = `on run argv
	activate
	set dialogText to "Allow " & (item 1 of argv) & " to open a Shell on this Mac?"
	if item 2 of argv is "true" then set dialogText to dialogText & linefeed & "This browser will be remembered."
	set dialogResult to display dialog dialogText with title "Virgo Terminal Client" buttons {"Cancel", "Allow"} default button "Cancel" cancel button "Cancel" with icon caution giving up after 25
	if gave up of dialogResult then return ""
	return button returned of dialogResult
end run`
	output, err := exec.CommandContext(ctx, "/usr/bin/osascript", "-e", dialog, "--", origin, strconv.FormatBool(remember)).Output()
	return err == nil && strings.TrimSpace(string(output)) == "Allow"
}
