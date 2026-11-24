import { useEffect, useRef, useState } from 'react';
import { ArrowUpIcon } from '@virgo-design/icons';
import { Button } from '@virgo-design/ui';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import type { DemoTerminalProps } from './demo-terminal-props';

const initialLogCount = 80;
const logIntervalMs = 500;

type LogRequest = { method: string; path: string; status: number; durationMs: number; detail?: string };

const successfulRequests = [
  { method: 'GET', path: '/api/health', status: 200, durationMs: 3 },
  { method: 'GET', path: '/api/projects', status: 200, durationMs: 16 },
  { method: 'POST', path: '/api/jobs', status: 202, durationMs: 38 },
  { method: 'GET', path: '/api/jobs/104', status: 200, durationMs: 22 },
  { method: 'PATCH', path: '/api/projects/12', status: 204, durationMs: 29 },
] as const satisfies readonly LogRequest[];

const failedRequests = [
  { method: 'GET', path: '/api/projects/87', status: 404, durationMs: 10, detail: 'Project not found' },
  { method: 'POST', path: '/api/jobs', status: 429, durationMs: 8, detail: 'Rate limited' },
  { method: 'GET', path: '/api/jobs/104', status: 503, durationMs: 125, detail: 'Upstream unavailable' },
] as const satisfies readonly LogRequest[];

function formatLogLine(sequence: number, time = new Date()) {
  const failed = sequence % 9 === 0;
  const samples = failed ? failedRequests : successfulRequests;
  const index = failed ? sequence / 9 : sequence - 1;
  const { method, path, status, durationMs, detail }: LogRequest = samples[index % samples.length] ?? samples[0];
  const timestamp = `${time.toTimeString().slice(0, 8)}.${String(time.getMilliseconds()).padStart(3, '0')}`;
  const level = status >= 500 ? '\x1b[91mERROR\x1b[0m' : status >= 400 ? '\x1b[33mWARN \x1b[0m' : '\x1b[32mINFO \x1b[0m';
  const latency = `${durationMs + Math.floor(Math.random() * 12)}ms`.padStart(5);
  const message = detail ? `  ${detail}` : '';
  return `${timestamp}  ${level}  ${method.padEnd(5)}  ${path.padEnd(17)}  ${status}  ${latency}${message}\r\n`;
}

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
