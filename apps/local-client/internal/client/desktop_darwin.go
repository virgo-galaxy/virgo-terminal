//go:build cgo

package client

// #cgo LDFLAGS: -framework AppKit
// #include <stdlib.h>
// void virgoRunClientWindow(const char *playgroundURL);
// void virgoStopClientWindow(void);
import "C"

import (
	"context"
	"os"
	"runtime"
	"strings"
	"unsafe"
)

func init() {
	// AppKit needs the process's original main thread.
	runtime.LockOSThread()
}

func runDesktopClient(playgroundURL string, stop context.CancelFunc, serve func() error) error {
	executable, err := os.Executable()
	if err != nil || !strings.HasSuffix(executable, ".app/Contents/MacOS/virgo-terminal") {
		return serve()
	}

	result := make(chan error, 1)
	go func() {
		result <- serve()
		C.virgoStopClientWindow()
	}()
	url := C.CString(playgroundURL)
	defer C.free(unsafe.Pointer(url))
	C.virgoRunClientWindow(url)
	stop()
	return <-result
}
