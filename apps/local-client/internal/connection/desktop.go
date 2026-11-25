package connection

import (
	"sync"

	"github.com/virgo-galaxy/virgo-terminal/apps/local-client/internal/shell"
)

type DesktopState int

const (
	DesktopIdle DesktopState = iota
	DesktopWaiting
	DesktopConnecting
	DesktopConnected
)

// DesktopSession authorizes one pairing attempt after Connect is clicked in the client.
type DesktopSession struct {
	mu       sync.Mutex
	state    DesktopState
	shell    shell.Option
	remember bool
}

func (d *DesktopSession) State() DesktopState {
	d.mu.Lock()
	defer d.mu.Unlock()
	return d.state
}

func (d *DesktopSession) Connect(option shell.Option, remember bool) bool {
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.state != DesktopIdle {
		return false
	}
	d.shell, d.remember = option, remember
	d.state = DesktopWaiting
	return true
}

func (d *DesktopSession) claim() (shell.Option, bool, bool) {
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.state != DesktopWaiting {
		return shell.Option{}, false, false
	}
	d.state = DesktopConnecting
	return d.shell, d.remember, true
}

func (d *DesktopSession) connected() {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.state = DesktopConnected
}

func (d *DesktopSession) finish() {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.state = DesktopIdle
}
