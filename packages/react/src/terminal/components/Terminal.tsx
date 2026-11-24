import { forwardRef, useImperativeHandle, useRef, type CSSProperties } from 'react';
import { useCopyOnSelect } from '../hooks/useCopyOnSelect.js';
import { useTerminalFit } from '../hooks/useTerminalFit.js';
import { useXterm } from '../hooks/useXterm.js';
import type { TerminalHandle, TerminalProps } from '../types.js';

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal(props, ref) {
  const { autoFit = false, className, copyOnSelect = false, scrollbar } = props;
  const container = useRef<HTMLDivElement>(null);
  const requestFitRef = useRef<(() => void) | null>(null);
  const instance = useXterm(container, props, requestFitRef);

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
    scrollToTop() {
      instance.current?.scrollToTop();
    },
  }), [instance]);

  useCopyOnSelect(instance, copyOnSelect);
  useTerminalFit(container, instance, autoFit, requestFitRef);

  const { thumbWidth, thumbRadius } = scrollbar ?? {};
  const scrollbarStyle = scrollbar && {
    '--virgo-terminal-thumb-width': thumbWidth !== undefined && Number.isFinite(thumbWidth)
      ? `${Math.max(1, thumbWidth)}px`
      : undefined,
    '--virgo-terminal-thumb-radius': thumbRadius !== undefined && Number.isFinite(thumbRadius)
      ? `${Math.max(0, thumbRadius)}px`
      : undefined,
  } as CSSProperties;

  return (
    <div
      ref={container}
      className={className}
      data-virgo-terminal-scrollbar={scrollbar && (scrollbar.visibility ?? 'auto')}
      style={scrollbarStyle}
    />
  );
});
