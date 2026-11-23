import * as fitAddon from '@xterm/addon-fit';
import * as xterm from '@xterm/xterm';
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';

type Xterm = xterm.Terminal;

// xterm.js supplies an ESM entry for bundlers and a CommonJS entry for Node.
const Xterm = xterm.Terminal ?? (Reflect.get(xterm, 'default') as typeof xterm).Terminal;
const FitAddon = fitAddon.FitAddon ?? (Reflect.get(fitAddon, 'default') as typeof fitAddon).FitAddon;

export type TerminalAppearance = Pick<xterm.ITerminalOptions, 'fontFamily' | 'fontSize' | 'theme' | 'cursorBlink'>;

export interface TerminalSize {
  cols: number;
  rows: number;
}

export interface TerminalHandle {
  write: Xterm['write'];
  getSize(): TerminalSize | null;
  focus(): void;
}

export interface TerminalProps {
  appearance?: TerminalAppearance;
  /** Fit the terminal to a container with a defined width and height. */
  autoFit?: boolean;
  className?: string;
  /** Copy the selected text on left mouse release. Defaults to false. */
  copyOnSelect?: boolean;
  onData?: (data: string) => void;
  onReady?: (terminal: Xterm) => void;
  onResize?: (size: TerminalSize) => void;
  readOnly?: boolean;
  /** Return false to skip xterm.js handling of this keyboard event. */
  shouldHandleKeyEvent?: (event: KeyboardEvent) => boolean;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal(
  {
    appearance,
    autoFit = false,
    className,
    copyOnSelect = false,
    onData,
    onReady,
    onResize,
    readOnly = false,
    shouldHandleKeyEvent,
  },
  ref,
) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<Xterm | null>(null);
  const defaultAppearance = useRef<Required<TerminalAppearance> | null>(null);
  const requestFit = useRef<(() => void) | null>(null);
  const settings = useRef({ appearance, onData, onReady, onResize, readOnly, shouldHandleKeyEvent });

  useLayoutEffect(() => {
    const previous = settings.current;
    settings.current = { appearance, onData, onReady, onResize, readOnly, shouldHandleKeyEvent };

    const terminal = instance.current;
    const defaults = defaultAppearance.current;
    if (!terminal || !defaults) return;

    const fontChanged = previous.appearance?.fontFamily !== appearance?.fontFamily;
    const sizeChanged = previous.appearance?.fontSize !== appearance?.fontSize;
    if (fontChanged) terminal.options.fontFamily = appearance?.fontFamily ?? defaults.fontFamily;
    if (sizeChanged) terminal.options.fontSize = appearance?.fontSize ?? defaults.fontSize;
    if (previous.appearance?.theme !== appearance?.theme) {
      terminal.options.theme = appearance?.theme ?? defaults.theme;
    }
    if (previous.appearance?.cursorBlink !== appearance?.cursorBlink) {
      terminal.options.cursorBlink = appearance?.cursorBlink ?? defaults.cursorBlink;
    }
    if (previous.readOnly !== readOnly) terminal.options.disableStdin = readOnly;
    if (fontChanged || sizeChanged) requestFit.current?.();
  }, [appearance, onData, onReady, onResize, readOnly, shouldHandleKeyEvent]);

  useImperativeHandle(ref, () => ({
    write(data, callback) {
      instance.current?.write(data, callback);
    },
    getSize() {
      const terminal = instance.current;
      return terminal ? { cols: terminal.cols, rows: terminal.rows } : null;
    },
    focus() {
      instance.current?.focus();
    },
  }), []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    const terminal = new Xterm({ disableStdin: settings.current.readOnly });
    const { fontFamily, fontSize, theme, cursorBlink } = terminal.options;
    defaultAppearance.current = {
      fontFamily: fontFamily ?? 'monospace',
      fontSize: fontSize ?? 15,
      theme: theme ?? {},
      cursorBlink: cursorBlink ?? false,
    };
    const input = terminal.onData((data) => settings.current.onData?.(data));
    const resize = terminal.onResize((size) => settings.current.onResize?.(size));

    function dispose() {
      instance.current = null;
      defaultAppearance.current = null;
      input.dispose();
      resize.dispose();
      terminal.dispose();
    }

    try {
      if (settings.current.appearance) terminal.options = settings.current.appearance;
      terminal.open(element);
      terminal.attachCustomKeyEventHandler((event) => settings.current.shouldHandleKeyEvent?.(event) ?? true);
      instance.current = terminal;
      settings.current.onReady?.(terminal);
    } catch (error) {
      dispose();
      throw error;
    }

    return dispose;
  }, []);

  useEffect(() => {
    const terminal = instance.current;
    const element = terminal?.element;
    if (!copyOnSelect || !terminal || !element) return;

    const ownerDocument = element.ownerDocument;
    const clipboard = ownerDocument.defaultView?.navigator.clipboard;
    if (!clipboard) return;

    let pressedInTerminal = false;
    let previousSelection: xterm.IBufferRange | undefined;

    const trackMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      pressedInTerminal = event.composedPath().includes(element);
      previousSelection = pressedInTerminal ? terminal.getSelectionPosition() : undefined;
    };

    const trackSelectionStart = (event: MouseEvent) => {
      // xterm may clear the old selection on press before the user selects the same range again.
      if (event.button === 0 && !terminal.hasSelection()) previousSelection = undefined;
    };

    const copySelection = (event: MouseEvent) => {
      if (event.button !== 0 || !pressedInTerminal) return;
      pressedInTerminal = false;

      const selection = terminal.getSelectionPosition();
      if (!selection) return;
      if (previousSelection
        && selection.start.x === previousSelection.start.x && selection.start.y === previousSelection.start.y
        && selection.end.x === previousSelection.end.x && selection.end.y === previousSelection.end.y) return;

      const text = terminal.getSelection();
      // Browser clipboard permission is independent of terminal selection.
      if (text) void clipboard.writeText(text).catch(() => {});
    };

    ownerDocument.addEventListener('mousedown', trackMouseDown, true);
    element.addEventListener('mousedown', trackSelectionStart);
    ownerDocument.addEventListener('mouseup', copySelection, true);

    return () => {
      ownerDocument.removeEventListener('mousedown', trackMouseDown, true);
      element.removeEventListener('mousedown', trackSelectionStart);
      ownerDocument.removeEventListener('mouseup', copySelection, true);
    };
  }, [copyOnSelect]);

  useEffect(() => {
    const element = container.current;
    const terminal = instance.current;
    if (!autoFit || !element || !terminal) return;

    const fit = new FitAddon();
    terminal.loadAddon(fit);

    let frame: number | undefined;
    const scheduleFit = () => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        if (element.clientWidth > 0 && element.clientHeight > 0) fit.fit();
      });
    };
    requestFit.current = scheduleFit;
    const observer = new ResizeObserver(scheduleFit);
    observer.observe(element);

    return () => {
      requestFit.current = null;
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      fit.dispose();
    };
  }, [autoFit]);

  return <div ref={container} className={className} />;
});
