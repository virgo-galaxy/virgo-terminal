import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Terminal, type TerminalAppearance, type TerminalHandle } from '@virgo-terminal/react';
import '@virgo-terminal/react/styles.css';
import { LocalShell } from './LocalShell';

const prompt = '[root@localhost] # ~ ';
const loadedAt = new Date();
const loginDate = loadedAt.toDateString().slice(0, 10);
const loginTime = loadedAt.toTimeString().slice(0, 8);
const loginMessage = `Last login: ${loginDate} ${loginTime} on ttys001`;

function InteractiveTerminal({ appearance }: { appearance: TerminalAppearance }) {
  const terminal = useRef<TerminalHandle>(null);
  const inputLength = useRef(0);

  return (
    <Terminal
      appearance={appearance}
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

function SimulatedLogs({ appearance }: { appearance: TerminalAppearance }) {
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
      appearance={appearance}
      autoFit
      className="terminal"
      readOnly
      ref={terminal}
      onReady={(xterm) => xterm.write(`\x1b[?25l${initialLogs}`)}
    />
  );
}

const fonts = {
  system: { label: 'System monospace', family: 'monospace' },
  console: { label: 'Monaco / Consolas', family: 'Monaco, Consolas, monospace' },
  courier: { label: 'Courier New', family: '"Courier New", monospace' },
};

const sizes = [12, 14, 15, 16, 18, 20, 24];

const themes = {
  classic: { label: 'Classic', colors: { background: '#000000', foreground: '#ffffff' } },
  paper: {
    label: 'Paper',
    colors: {
      background: '#f4f1e8', foreground: '#252627', cursor: '#252627', cursorAccent: '#f4f1e8',
      selectionBackground: '#c4d3e2',
      black: '#252627', red: '#9b2d35', green: '#176345', yellow: '#805000', blue: '#344e93',
      magenta: '#783c87', cyan: '#17616a', white: '#504e49',
      brightBlack: '#555550', brightRed: '#9e2834', brightGreen: '#176345', brightYellow: '#805000',
      brightBlue: '#344e93', brightMagenta: '#783c87', brightCyan: '#17616a', brightWhite: '#252627',
    },
  },
} satisfies Record<string, { label: string; colors: NonNullable<TerminalAppearance['theme']> }>;

function Playground() {
  const [view, setView] = useState<'terminal' | 'logs' | 'shell'>('terminal');
  const [font, setFont] = useState<keyof typeof fonts>('system');
  const [fontSize, setFontSize] = useState(15);
  const [theme, setTheme] = useState<keyof typeof themes>('classic');
  const appearance = { fontFamily: fonts[font].family, fontSize, theme: themes[theme].colors };

  return (
    <>
      <header>
        <nav aria-label="Playground view">
          <button type="button" aria-pressed={view === 'terminal'} onClick={() => setView('terminal')}>Terminal</button>
          <button type="button" aria-pressed={view === 'logs'} onClick={() => setView('logs')}>Simulated logs</button>
          {import.meta.env.DEV && (
            <button type="button" aria-pressed={view === 'shell'} onClick={() => setView('shell')}>Local Shell</button>
          )}
        </nav>
        <details className="appearance" onKeyDown={(event) => {
          if (event.key !== 'Escape' || !event.currentTarget.open) return;
          event.currentTarget.open = false;
          event.currentTarget.querySelector('summary')?.focus();
        }}>
          <summary>Appearance</summary>
          <div className="appearance-options">
            <div className="appearance-field">
              <label htmlFor="appearance-font">Font</label>
              <select id="appearance-font" value={font} onChange={(event) => setFont(event.currentTarget.value as keyof typeof fonts)}>
                {Object.entries(fonts).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
              </select>
            </div>
            <div className="appearance-field">
              <label htmlFor="appearance-size">Size</label>
              <select id="appearance-size" value={fontSize} onChange={(event) => setFontSize(Number(event.currentTarget.value))}>
                {sizes.map((size) => <option key={size} value={size}>{size} px</option>)}
              </select>
            </div>
            <div className="appearance-field">
              <label htmlFor="appearance-theme">Theme</label>
              <select id="appearance-theme" value={theme} onChange={(event) => setTheme(event.currentTarget.value as keyof typeof themes)}>
                {Object.entries(themes).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
              </select>
            </div>
          </div>
        </details>
      </header>
      <main style={{ backgroundColor: appearance.theme.background }}>
        {view === 'terminal' && <InteractiveTerminal appearance={appearance} />}
        {view === 'logs' && <SimulatedLogs appearance={appearance} />}
        {import.meta.env.DEV && view === 'shell' && <LocalShell appearance={appearance} />}
      </main>
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
