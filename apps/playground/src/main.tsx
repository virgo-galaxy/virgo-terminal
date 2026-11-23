import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import '@virgo-terminal/react/styles.css';

const prompt = '[root@localhost] # ~ ';
const loadedAt = new Date();
const loginDate = loadedAt.toDateString().slice(0, 10);
const loginTime = loadedAt.toTimeString().slice(0, 8);
const loginMessage = `Last login: ${loginDate} ${loginTime} on ttys001`;

function InteractiveTerminal() {
  const terminal = useRef<TerminalHandle>(null);
  const inputLength = useRef(0);

  return (
    <Terminal
      autoFit
      className="terminal"
      ref={terminal}
      onReady={(xterm) => {
        inputLength.current = 0;
        xterm.options.cursorBlink = true;
        xterm.write(`${loginMessage}\r\n${prompt}`);
        xterm.focus();
      }}
      onData={(data) => {
        if (data === '\x7f' || data === '\b') {
          if (inputLength.current > 0) {
            inputLength.current -= 1;
            terminal.current?.write('\b \b');
          }
          return;
        }
        if (data.startsWith('\x1b')) return;

        const text = Array.from(data.replace(/\r\n?/g, '\n'))
          .filter((char) => char === '\n' || (char >= ' ' && char !== '\x7f'))
          .join('');
        const lastNewline = text.lastIndexOf('\n');
        if (lastNewline !== -1) inputLength.current = 0;
        inputLength.current += Array.from(text.slice(lastNewline + 1)).length;
        terminal.current?.write(text.replaceAll('\n', `\r\n${prompt}`));
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
