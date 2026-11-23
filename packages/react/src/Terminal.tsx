import * as fitAddon from '@xterm/addon-fit';
import * as xterm from '@xterm/xterm';
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';

type Xterm = xterm.Terminal;

// xterm.js supplies an ESM entry for bundlers and a CommonJS entry for Node.
const Xterm = xterm.Terminal ?? (Reflect.get(xterm, 'default') as typeof xterm).Terminal;
const FitAddon = fitAddon.FitAddon ?? (Reflect.get(fitAddon, 'default') as typeof fitAddon).FitAddon;

export interface TerminalHandle {
  write: Xterm['write'];
}

export interface TerminalProps {
  /** Fit the terminal to a container with a defined width and height. */
  autoFit?: boolean;
  className?: string;
  onData?: (data: string) => void;
  onReady?: (terminal: Xterm) => void;
  readOnly?: boolean;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal(
  { autoFit = false, className, onData, onReady, readOnly = false },
  ref,
) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<Xterm | null>(null);
  const settings = useRef({ onData, onReady, readOnly });

  useLayoutEffect(() => {
    if (instance.current && settings.current.readOnly !== readOnly) {
      instance.current.options.disableStdin = readOnly;
    }
    settings.current = { onData, onReady, readOnly };
  }, [onData, onReady, readOnly]);

  useImperativeHandle(ref, () => ({
    write(data, callback) {
      instance.current?.write(data, callback);
    },
  }), []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    const terminal = new Xterm({ disableStdin: settings.current.readOnly });
    const input = terminal.onData((data) => settings.current.onData?.(data));

    function dispose() {
      instance.current = null;
      input.dispose();
      terminal.dispose();
    }

    try {
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
    const observer = new ResizeObserver(() => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        if (element.clientWidth > 0 && element.clientHeight > 0) fit.fit();
      });
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      fit.dispose();
    };
  }, [autoFit]);

  return <div ref={container} className={className} />;
});
