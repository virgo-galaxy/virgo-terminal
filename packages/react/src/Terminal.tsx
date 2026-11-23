import * as fitAddon from '@xterm/addon-fit';
import * as xterm from '@xterm/xterm';
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';

type Xterm = xterm.Terminal;

// xterm.js supplies an ESM entry for bundlers and a CommonJS entry for Node.
const Xterm = xterm.Terminal ?? (Reflect.get(xterm, 'default') as typeof xterm).Terminal;
const FitAddon = fitAddon.FitAddon ?? (Reflect.get(fitAddon, 'default') as typeof fitAddon).FitAddon;

export type TerminalAppearance = Pick<xterm.ITerminalOptions, 'fontFamily' | 'fontSize' | 'theme'>;

export interface TerminalSize {
  cols: number;
  rows: number;
}

export interface TerminalHandle {
  write: Xterm['write'];
}

export interface TerminalProps {
  appearance?: TerminalAppearance;
  /** Fit the terminal to a container with a defined width and height. */
  autoFit?: boolean;
  className?: string;
  onData?: (data: string) => void;
  onReady?: (terminal: Xterm) => void;
  onResize?: (size: TerminalSize) => void;
  readOnly?: boolean;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal(
  { appearance, autoFit = false, className, onData, onReady, onResize, readOnly = false },
  ref,
) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<Xterm | null>(null);
  const defaultAppearance = useRef<Required<TerminalAppearance> | null>(null);
  const requestFit = useRef<(() => void) | null>(null);
  const settings = useRef({ appearance, onData, onReady, onResize, readOnly });

  useLayoutEffect(() => {
    const previous = settings.current;
    settings.current = { appearance, onData, onReady, onResize, readOnly };

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
    if (previous.readOnly !== readOnly) terminal.options.disableStdin = readOnly;
    if (fontChanged || sizeChanged) requestFit.current?.();
  }, [appearance, onData, onReady, onResize, readOnly]);

  useImperativeHandle(ref, () => ({
    write(data, callback) {
      instance.current?.write(data, callback);
    },
  }), []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    const terminal = new Xterm({ disableStdin: settings.current.readOnly });
    const { fontFamily, fontSize, theme } = terminal.options;
    defaultAppearance.current = {
      fontFamily: fontFamily ?? 'monospace',
      fontSize: fontSize ?? 15,
      theme: theme ?? {},
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
      instance.current = terminal;
      settings.current.onReady?.(terminal);
    } catch (error) {
      dispose();
      throw error;
    }

    return dispose;
  }, []);

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
