package client

import "unicode/utf16"

type windowsDesktopText struct {
	status        [4]string
	systemDefault string
	remember      string
	forget        string
	open          string
	openError     string
	quit          string
	connect       string
}

func windowsClientText() windowsDesktopText {
	const chineseLanguage = 0x04
	language, _, _ := getUserDefaultUILanguage.Call()
	if language&0x03ff == chineseLanguage {
		return windowsDesktopText{
			status:        [4]string{"等待连接中", "等待浏览器连接…", "正在连接…", "已连接"},
			systemDefault: "（系统默认）", remember: "记住此浏览器", forget: "清除已记住的浏览器",
			open: "打开 Playground", openError: "无法打开 Playground。", quit: "退出客户端", connect: "连接",
		}
	}
	return windowsDesktopText{
		status:        [4]string{"Waiting to connect", "Waiting for the browser…", "Connecting…", "Connected"},
		systemDefault: " (System default)", remember: "Remember this browser", forget: "Forget remembered browser",
		open: "Open Playground", openError: "Could not open Playground.", quit: "Quit Client", connect: "Connect",
	}
}

type dialogControl struct {
	class, id           uint16
	x, y, width, height uint16
	style               uint32
	text                string
}

type dialogTemplate []uint16

func (d *dialogTemplate) dword(value uint32) {
	*d = append(*d, uint16(value), uint16(value>>16))
}

func (d *dialogTemplate) text(value string) {
	*d = append(*d, utf16.Encode([]rune(value))...)
	*d = append(*d, 0)
}

func windowsClientTemplate(text windowsDesktopText) dialogTemplate {
	const (
		wsPopup       uint32 = 0x80000000
		wsChild       uint32 = 0x40000000
		wsVisible     uint32 = 0x10000000
		wsCaption     uint32 = 0x00c00000
		wsVScroll     uint32 = 0x00200000
		wsSysMenu     uint32 = 0x00080000
		wsTabStop     uint32 = 0x00010000
		dsCenter      uint32 = 0x0800
		dsSetFont     uint32 = 0x0040
		bsDefault     uint32 = 0x0001
		bsAutoCheck   uint32 = 0x0003
		bsFlat        uint32 = 0x8000
		cbsDropDown   uint32 = 0x0003 // CBS_DROPDOWNLIST
		buttonClass   uint16 = 0x0080
		staticClass   uint16 = 0x0082
		comboBoxClass uint16 = 0x0085
	)
	controls := []dialogControl{
		{class: staticClass, id: winStatus, x: 14, y: 13, width: 252, height: 14},
		{class: staticClass, id: 0xffff, x: 14, y: 39, width: 39, height: 12, text: "&Shell"},
		{class: comboBoxClass, id: winShell, x: 58, y: 36, width: 208, height: 76, style: wsTabStop | wsVScroll | cbsDropDown},
		{class: buttonClass, id: winRemember, x: 14, y: 63, width: 252, height: 14, style: wsTabStop | bsAutoCheck, text: text.remember},
		{class: buttonClass, id: winOpen, x: 14, y: 93, width: 95, height: 18, style: wsTabStop | bsFlat, text: text.open},
		{class: buttonClass, id: winQuit, x: 143, y: 93, width: 60, height: 18, style: wsTabStop, text: text.quit},
		{class: buttonClass, id: winConnect, x: 209, y: 93, width: 57, height: 18, style: wsTabStop | bsDefault, text: text.connect},
	}

	// A standard DLGTEMPLATE followed by DWORD-aligned DLGITEMTEMPLATE records.
	var dialog dialogTemplate
	dialog.dword(wsPopup | wsCaption | wsSysMenu | dsCenter | dsSetFont)
	dialog.dword(0)                                                      // Extended style.
	dialog = append(dialog, uint16(len(controls)), 0, 0, 280, 125, 0, 0) // Position, size, menu and class.
	dialog.text(winClientTitle)
	dialog = append(dialog, 9) // Font size in points.
	dialog.text("Segoe UI")
	for _, control := range controls {
		if len(dialog)%2 != 0 {
			dialog = append(dialog, 0)
		}
		dialog.dword(wsChild | wsVisible | control.style)
		dialog.dword(0)
		dialog = append(dialog, control.x, control.y, control.width, control.height, control.id, 0xffff, control.class)
		dialog.text(control.text)
		dialog = append(dialog, 0) // No creation data.
	}
	return dialog
}
