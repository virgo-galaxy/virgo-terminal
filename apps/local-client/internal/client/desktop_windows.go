package client

import (
	"context"
	"fmt"
	"runtime"
	"syscall"
	"unsafe"

	"github.com/virgo-galaxy/virgo-terminal/apps/local-client/internal/connection"
	"golang.org/x/sys/windows"
)

const (
	winClientTitle = "Virgo Terminal Client"
	winConnect     = 1 // IDOK, the dialog's default action.
	winQuit        = 2 // IDCANCEL, also used by Escape and the close button.
	winStatus      = 100
	winShell       = 101
	winRemember    = 102
	winOpen        = 104
	winForget      = 0x1010 // Custom system-menu command.
	winStatusTimer = 1
)

var (
	user32                   = windows.NewLazySystemDLL("user32.dll")
	kernel32                 = windows.NewLazySystemDLL("kernel32.dll")
	dialogBoxIndirectParamW  = user32.NewProc("DialogBoxIndirectParamW")
	endDialog                = user32.NewProc("EndDialog")
	getDlgItem               = user32.NewProc("GetDlgItem")
	sendDlgItemMessageW      = user32.NewProc("SendDlgItemMessageW")
	setDlgItemTextW          = user32.NewProc("SetDlgItemTextW")
	isDlgButtonChecked       = user32.NewProc("IsDlgButtonChecked")
	checkDlgButton           = user32.NewProc("CheckDlgButton")
	enableWindow             = user32.NewProc("EnableWindow")
	setTimer                 = user32.NewProc("SetTimer")
	loadIconW                = user32.NewProc("LoadIconW")
	sendMessageW             = user32.NewProc("SendMessageW")
	getSystemMenu            = user32.NewProc("GetSystemMenu")
	appendMenuW              = user32.NewProc("AppendMenuW")
	messageBoxW              = user32.NewProc("MessageBoxW")
	getModuleHandleW         = kernel32.NewProc("GetModuleHandleW")
	getUserDefaultUILanguage = kernel32.NewProc("GetUserDefaultUILanguage")
	shellExecuteW            = windows.NewLazySystemDLL("shell32.dll").NewProc("ShellExecuteW")
)

type windowsDesktop struct {
	config   desktopConfig
	text     windowsDesktopText
	instance uintptr
	finished <-chan struct{}
	state    connection.DesktopState
	initErr  error
}

func runDesktopClient(config desktopConfig, stop context.CancelFunc, serve func() error) error {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	instance, _, err := getModuleHandleW.Call(0)
	if instance == 0 {
		return fmt.Errorf("get client module: %w", err)
	}
	finished := make(chan struct{})
	var serveErr error
	go func() {
		serveErr = serve()
		close(finished)
	}()

	desktop := &windowsDesktop{
		config: config, text: windowsClientText(), instance: instance, finished: finished, state: -1,
	}
	template := windowsClientTemplate(desktop.text)
	callback := syscall.NewCallback(desktop.handleMessage)
	result, _, dialogErr := dialogBoxIndirectParamW.Call(instance, uintptr(unsafe.Pointer(&template[0])), 0, callback, 0)
	runtime.KeepAlive(template)
	stop()
	<-finished
	if result == 0 || result == ^uintptr(0) {
		return fmt.Errorf("open client window: %w", dialogErr)
	}
	if desktop.initErr != nil {
		return desktop.initErr
	}
	return serveErr
}

func (d *windowsDesktop) handleMessage(hwnd, message, wParam, _ uintptr) uintptr {
	const (
		wmClose      = 0x0010
		wmInitDialog = 0x0110
		wmCommand    = 0x0111
		wmSysCommand = 0x0112
		wmTimer      = 0x0113
		cbGetCurSel  = 0x0147
		bstChecked   = 1
	)

	switch message {
	case wmInitDialog:
		d.initialize(hwnd)
	case wmCommand:
		switch uint16(wParam) {
		case winConnect:
			index, _, _ := sendDlgItemMessageW.Call(hwnd, winShell, cbGetCurSel, 0, 0)
			checked, _, _ := isDlgButtonChecked.Call(hwnd, winRemember)
			d.config.connect(int(index), checked == bstChecked)
			d.updateStatus(hwnd)
		case winQuit:
			endDialog.Call(hwnd, 1)
		case winOpen:
			const swShowNormal = 1
			result, _, _ := shellExecuteW.Call(hwnd, uintptr(unsafe.Pointer(winText("open"))),
				uintptr(unsafe.Pointer(winText(d.config.playgroundURL))), 0, 0, swShowNormal)
			if result <= 32 {
				showWindowsError(hwnd, d.text.openError)
			}
		default:
			return 0
		}
	case wmSysCommand:
		if wParam&0xfff0 != winForget {
			return 0
		}
		d.config.forgetBrowser()
	case wmClose:
		endDialog.Call(hwnd, 1)
	case wmTimer:
		if wParam != winStatusTimer {
			return 0
		}
		select {
		case <-d.finished:
			endDialog.Call(hwnd, 1)
		default:
			d.updateStatus(hwnd)
		}
	default:
		return 0
	}
	return 1
}

func (d *windowsDesktop) initialize(hwnd uintptr) {
	const (
		wmSetIcon    = 0x0080
		idiApp       = 32512
		cbAddString  = 0x0143
		cbSetCurSel  = 0x014E
		bstChecked   = 1
		statusPollMS = 200
		mfSeparator  = 0x0800
	)

	icon, _, _ := loadIconW.Call(d.instance, 1) // The packaged app icon resource.
	if icon == 0 {
		icon, _, _ = loadIconW.Call(0, idiApp)
	}
	sendMessageW.Call(hwnd, wmSetIcon, 0, icon) // ICON_SMALL
	sendMessageW.Call(hwnd, wmSetIcon, 1, icon) // ICON_BIG
	if menu, _, _ := getSystemMenu.Call(hwnd, 0); menu != 0 {
		appendMenuW.Call(menu, mfSeparator, 0, 0)
		appendMenuW.Call(menu, 0, winForget, uintptr(unsafe.Pointer(winText(d.text.forget))))
	}

	for index, option := range d.config.shells {
		name := option.Name
		if index == 0 {
			name += d.text.systemDefault
		}
		result, _, _ := sendDlgItemMessageW.Call(hwnd, winShell, cbAddString, 0, uintptr(unsafe.Pointer(winText(name))))
		if int(result) < 0 {
			d.initErr = fmt.Errorf("add shell %q to the client window", option.Name)
			endDialog.Call(hwnd, 1)
			return
		}
	}
	sendDlgItemMessageW.Call(hwnd, winShell, cbSetCurSel, 0, 0)
	checkDlgButton.Call(hwnd, winRemember, bstChecked)
	d.updateStatus(hwnd)
	if timer, _, err := setTimer.Call(hwnd, winStatusTimer, statusPollMS, 0); timer == 0 {
		d.initErr = fmt.Errorf("start client status timer: %w", err)
		endDialog.Call(hwnd, 1)
	}
}

func (d *windowsDesktop) updateStatus(hwnd uintptr) {
	state := d.config.session.State()
	if d.state == state {
		return
	}
	d.state = state
	setDlgItemTextW.Call(hwnd, winStatus, uintptr(unsafe.Pointer(winText(d.text.status[state]))))
	var enabled uintptr
	if state == connection.DesktopIdle {
		enabled = 1
	}
	for _, id := range []uintptr{winConnect, winShell, winRemember} {
		control, _, _ := getDlgItem.Call(hwnd, id)
		enableWindow.Call(control, enabled)
	}
}

func winText(text string) *uint16 {
	return windows.StringToUTF16Ptr(text)
}

func showWindowsError(hwnd uintptr, message string) {
	const mbIconError = 0x0010
	messageBoxW.Call(hwnd, uintptr(unsafe.Pointer(winText(message))),
		uintptr(unsafe.Pointer(winText(winClientTitle))), mbIconError)
}

func reportDesktopError(err error) {
	showWindowsError(0, err.Error())
}
