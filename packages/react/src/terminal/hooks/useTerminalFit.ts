import * as fitAddon from '@xterm/addon-fit';
import type { Terminal as Xterm } from '@xterm/xterm';
import { useEffect, type RefObject } from 'react';

const FitAddon = fitAddon.FitAddon ?? (Reflect.get(fitAddon, 'default') as typeof fitAddon).FitAddon;

export function useTerminalFit(
  container: RefObject<HTMLDivElement | null>,
  instance: RefObject<Xterm | null>,
  autoFit: boolean,
  requestFitRef: RefObject<(() => void) | null>,
) {
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
    requestFitRef.current = scheduleFit;
    const observer = new ResizeObserver(scheduleFit);
    observer.observe(element);

    return () => {
      requestFitRef.current = null;
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      fit.dispose();
    };
  }, [autoFit, container, instance, requestFitRef]);
}
