package connection

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"os"
	"path/filepath"
	"sync"
)

// BrowserTrust holds the digest of the browser key approved for one Playground origin.
type BrowserTrust struct {
	mu     sync.Mutex
	path   string
	digest []byte
}

func NewBrowserTrust(origin string) (*BrowserTrust, error) {
	config, err := os.UserConfigDir()
	if err != nil {
		return &BrowserTrust{}, err
	}
	originHash := sha256.Sum256([]byte(origin))
	path := filepath.Join(config, "Virgo Terminal", "trusted-browsers", hex.EncodeToString(originHash[:]))
	digest, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		err = nil
	}
	if len(digest) != sha256.Size {
		digest = nil
	}
	return &BrowserTrust{path: path, digest: digest}, err
}

func browserDigest(key string) ([]byte, bool) {
	if len(key) != sha256.Size*2 {
		return nil, false
	}
	decoded, err := hex.DecodeString(key)
	if err != nil {
		return nil, false
	}
	digest := sha256.Sum256(decoded)
	return digest[:], true
}

func (b *BrowserTrust) Matches(key string) bool {
	digest, ok := browserDigest(key)
	b.mu.Lock()
	defer b.mu.Unlock()
	return ok && subtle.ConstantTimeCompare(b.digest, digest) == 1
}

func (b *BrowserTrust) Remember(key string) error {
	digest, ok := browserDigest(key)
	if !ok || b.path == "" {
		return nil
	}
	b.mu.Lock()
	defer b.mu.Unlock()

	directory := filepath.Dir(b.path)
	if err := os.MkdirAll(directory, 0o700); err != nil {
		return err
	}
	file, err := os.CreateTemp(directory, ".browser-")
	if err != nil {
		return err
	}
	defer os.Remove(file.Name())
	_, writeErr := file.Write(digest)
	if err := errors.Join(writeErr, file.Close()); err != nil {
		return err
	}
	if err := os.Rename(file.Name(), b.path); err != nil {
		return err
	}
	b.digest = digest
	return nil
}

func (b *BrowserTrust) Forget() error {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.path == "" {
		return nil
	}
	if err := os.Remove(b.path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	b.digest = nil
	return nil
}
