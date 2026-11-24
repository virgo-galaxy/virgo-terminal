import { useEffect, useRef, useState } from 'react';
import { ArrowUpIcon } from '@virgo-design/icons';
import { Button } from '@virgo-design/ui';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import type { DemoTerminalProps } from '@/examples/types';
import { formatLogLine } from './lib/formatLogLine';

const initialLogCount = 80;
const logIntervalMs = 500;

export function SimulatedLogs({ appearance, copyOnSelect, scrollbar, scrollback, showBackToTop }: DemoTerminalProps & {
  showBackToTop: boolean;
}) {
  const terminal = useRef<TerminalHandle>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);

  useEffect(() => {
    let line = initialLogCount;
    const timer = window.setInterval(() => {
      line += 1;
      terminal.current?.write(formatLogLine(line));
    }, logIntervalMs);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="simulated-logs">
      <Terminal
        appearance={appearance}
        autoFit
        className="terminal"
        copyOnSelect={copyOnSelect}
        readOnly
        ref={terminal}
        scrollbar={scrollbar}
        scrollback={scrollback}
        onReady={(xterm) => {
          xterm.onRender(() => setCanScrollUp(xterm.buffer.active.viewportY > 0));
          xterm.onSelectionChange(() => {
            if (xterm.hasSelection() && !xterm.getSelection()) xterm.clearSelection();
          });
          const now = Date.now();
          const history = Array.from({ length: initialLogCount }, (_, index) => (
            formatLogLine(index + 1, new Date(now - (initialLogCount - index) * logIntervalMs))
          )).join('');
          xterm.write(`\x1b[?25l${history}`);
        }}
      />
      {showBackToTop && canScrollUp && (
        <Button
          type="button"
          className="logs-back-to-top"
          variant="secondary"
          size="small"
          iconOnly
          aria-label="Back to top"
          title="Back to top"
          onClick={() => {
            terminal.current?.focus();
            terminal.current?.scrollToTop();
          }}
        >
          <ArrowUpIcon aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
