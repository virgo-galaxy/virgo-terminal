import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import '@virgo-terminal/react/styles.css';

function InteractiveTerminal() {
  const terminal = useRef<TerminalHandle>(null);

  return (
    <Terminal
      autoFit
      className="terminal"
      ref={terminal}
      onReady={(xterm) => {
        xterm.options.cursorBlink = true;
        xterm.writeln('Hello Terminal');
        xterm.focus();
      }}
      onData={(data) => {
        if (data === '\r') {
          terminal.current?.write('\r\n');
        } else if (data === '\x7f' || data === '\b') {
          terminal.current?.write('\b \b');
        } else {
          terminal.current?.write(data);
        }
      }}
    />
  );
}

const initialLogCount = 80;

function formatLogLine(line: number) {
  const prefix = String(line).padStart(4, '0');
  const status = line % 9 === 0
    ? '\x1b[33mWARN\x1b[0m  Worker is busy'
    : '\x1b[32mINFO\x1b[0m  Task completed';
  return `${prefix}  ${status}\r\n`;
}

const initialLogs = Array.from({ length: initialLogCount }, (_, index) => formatLogLine(index + 1)).join('');

function SimulatedLogs() {
  const terminal = useRef<TerminalHandle>(null);

  useEffect(() => {
    let line = initialLogCount;
    const timer = window.setInterval(() => {
      line += 1;
      terminal.current?.write(formatLogLine(line));
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Terminal
      autoFit
      className="terminal"
      readOnly
      ref={terminal}
      onReady={(xterm) => xterm.write(`\x1b[?25l${initialLogs}`)}
    />
  );
}

function Playground() {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <>
      <nav aria-label="Playground view">
        <button type="button" aria-pressed={!showLogs} onClick={() => setShowLogs(false)}>Terminal</button>
        <button type="button" aria-pressed={showLogs} onClick={() => setShowLogs(true)}>Simulated logs</button>
      </nav>
      <main>{showLogs ? <SimulatedLogs /> : <InteractiveTerminal />}</main>
    </>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Playground root element is missing.');

createRoot(root).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
