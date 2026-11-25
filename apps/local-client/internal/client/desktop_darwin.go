//go:build cgo

package client

// #cgo LDFLAGS: -framework AppKit
// #include <stdlib.h>
// void virgoRunClientWindow(const char *playgroundURL, const char *shellNames);
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

// AppKit accesses this configuration only on the main thread.
var macDesktop desktopConfig

//export virgoConnectShell
func virgoConnectShell(index C.int, remember C.int) {
	macDesktop.connect(int(index), remember != 0)
}

//export virgoConnectionState
func virgoConnectionState() C.int {
	return C.int(macDesktop.session.State())
}

//export virgoForgetBrowser
func virgoForgetBrowser() {
	macDesktop.forgetBrowser()
}

func runDesktopClient(config desktopConfig, stop context.CancelFunc, serve func() error) error {
	executable, err := os.Executable()
	if err != nil || !strings.HasSuffix(executable, ".app/Contents/MacOS/virgo-terminal") {
		return runConsoleClient(config, stop, serve)
	}

	result := make(chan error, 1)
	go func() {
		result <- serve()
		C.virgoStopClientWindow()
	}()
	macDesktop = config
	names := make([]string, len(config.shells))
	for i, option := range config.shells {
		names[i] = option.Name
	}
	url := C.CString(config.playgroundURL)
	shellNames := C.CString(strings.Join(names, "\n"))
	defer C.free(unsafe.Pointer(url))
	defer C.free(unsafe.Pointer(shellNames))
	C.virgoRunClientWindow(url, shellNames)
	stop()
	return <-result
}
