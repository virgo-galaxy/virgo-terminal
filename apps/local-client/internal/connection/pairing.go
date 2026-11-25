package connection

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"sync"
	"time"
)

const idleTimeout = 5 * time.Minute

type pairing struct {
	mu      sync.Mutex
	launch  string
	session string
	active  bool
	expires time.Time
}

func newPairing() (*pairing, error) {
	var keys [64]byte
	if _, err := rand.Read(keys[:]); err != nil {
		return nil, err
	}
	return &pairing{
		launch:  hex.EncodeToString(keys[:32]),
		session: hex.EncodeToString(keys[32:]),
		expires: time.Now().Add(idleTimeout),
	}, nil
}

func (p *pairing) claim(key string) bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.active || time.Now().After(p.expires) {
		return false
	}
	expected := p.launch
	if expected == "" {
		expected = p.session
	}
	if subtle.ConstantTimeCompare([]byte(key), []byte(expected)) != 1 {
		return false
	}
	p.active = true
	return true
}

func (p *pairing) complete() {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.launch = ""
}

func (p *pairing) release() {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.active = false
	if p.launch == "" {
		p.expires = time.Now().Add(idleTimeout)
	}
}

func (p *pairing) expired() bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	return !p.active && time.Now().After(p.expires)
}
