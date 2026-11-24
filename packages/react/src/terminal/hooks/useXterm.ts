import * as xterm from '@xterm/xterm';
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import type { TerminalAppearance, TerminalProps } from '../types.js';

type Xterm = xterm.Terminal;
type XtermOptions = Pick<
  TerminalProps,
  'appearance' | 'onData' | 'onReady' | 'onResize' | 'readOnly' | 'scrollback' | 'shouldHandleKeyEvent'
>;

// xterm.js supplies an ESM entry for bundlers and a CommonJS entry for Node.
const Xterm = xterm.Terminal ?? (Reflect.get(xterm, 'default') as typeof xterm).Terminal;

export function useXterm(
  container: RefObject<HTMLDivElement | null>,
  { appearance, onData, onReady, onResize, readOnly = false, scrollback, shouldHandleKeyEvent }: XtermOptions,
  requestFitRef: RefObject<(() => void) | null>,
) {
  const instance = useRef<Xterm | null>(null);
  const defaultOptions = useRef<(Required<TerminalAppearance> & { scrollback: number }) | null>(null);
  const historyLimit = scrollback !== undefined && Number.isSafeInteger(scrollback) && scrollback >= 0
    ? scrollback
    : undefined;
  const settings = useRef({ appearance, onData, onReady, onResize, readOnly, historyLimit, shouldHandleKeyEvent });

  useLayoutEffect(() => {
    const previous = settings.current;
    settings.current = { appearance, onData, onReady, onResize, readOnly, historyLimit, shouldHandleKeyEvent };

    const terminal = instance.current;
    const defaults = defaultOptions.current;
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

    const previousLimit = terminal.options.scrollback;
    const nextLimit = historyLimit ?? defaults.scrollback;
    if (previous.historyLimit !== historyLimit && previousLimit !== nextLimit) {
      terminal.options.scrollback = nextLimit;
      terminal.refresh(0, terminal.rows - 1);
    }
    if (fontChanged || sizeChanged || (previousLimit === 0) !== (terminal.options.scrollback === 0)) {
      requestFitRef.current?.();
    }
  }, [appearance, onData, onReady, onResize, readOnly, historyLimit, shouldHandleKeyEvent, requestFitRef]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    const terminal = new Xterm({ disableStdin: settings.current.readOnly });
    const { fontFamily, fontSize, theme, cursorBlink, scrollback: nativeScrollback } = terminal.options;
    defaultOptions.current = {
      fontFamily: fontFamily ?? 'monospace',
      fontSize: fontSize ?? 15,
      theme: theme ?? {},
      cursorBlink: cursorBlink ?? false,
      scrollback: nativeScrollback ?? 1000,
    };
    const input = terminal.onData((data) => settings.current.onData?.(data));
    const resize = terminal.onResize((size) => settings.current.onResize?.(size));

    function dispose() {
      instance.current = null;
      defaultOptions.current = null;
      input.dispose();
      resize.dispose();
      terminal.dispose();
    }

    try {
      if (settings.current.appearance) terminal.options = settings.current.appearance;
      if (settings.current.historyLimit !== undefined) terminal.options.scrollback = settings.current.historyLimit;
      terminal.open(element);
      terminal.attachCustomKeyEventHandler((event) => settings.current.shouldHandleKeyEvent?.(event) ?? true);
      instance.current = terminal;
      settings.current.onReady?.(terminal);
    } catch (error) {
      dispose();
      throw error;
    }

    return dispose;
  }, [container]);

  return instance;
}
