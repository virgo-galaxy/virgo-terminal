import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { monoFonts } from '@virgo-design/fonts';
import { ChevronDownIcon } from '@virgo-design/icons';
import { Button, Popover, SegmentedControl, Select } from '@virgo-design/ui';
import { Terminal, type TerminalAppearance, type TerminalHandle } from '@virgo-terminal/react';
import '@virgo-design/fonts/sans/inter.css';
import '@virgo-design/fonts/mono/jetbrains-mono.css';
import '@virgo-design/tokens/styles.css';
import '@virgo-design/themes/virgo.css';
import '@virgo-design/ui/styles.css';
import '@virgo-terminal/react/styles.css';
import './playground.css';
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
      appearance={{ ...appearance, cursorBlink: true }}
      autoFit
      className="terminal"
      ref={terminal}
      onReady={() => {
        inputLength.current = 0;
        terminal.current?.write(`${loginMessage}\r\n${prompt}`);
        terminal.current?.focus();
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
      onReady={() => terminal.current?.write(`\x1b[?25l${initialLogs}`)}
    />
  );
}

const fonts = {
  jetbrains: { label: monoFonts.jetbrainsMono.name, family: `${monoFonts.jetbrainsMono.cssFamily}, monospace` },
  system: { label: 'System monospace', family: 'monospace' },
  console: { label: 'Monaco / Consolas', family: 'Monaco, Consolas, monospace' },
  courier: { label: 'Courier New', family: '"Courier New", monospace' },
};

const defaultFontSize = 15;
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

type View = 'terminal' | 'logs' | 'shell';

function Playground({ initialFont }: { initialFont: keyof typeof fonts }) {
  const [view, setView] = useState<View>('terminal');
  const [font, setFont] = useState(initialFont);
  const [fontSize, setFontSize] = useState(String(defaultFontSize));
  const [theme, setTheme] = useState<keyof typeof themes>('classic');
  const appearance = { fontFamily: fonts[font].family, fontSize: Number(fontSize), theme: themes[theme].colors };

  return (
    <>
      <header className="toolbar">
        <SegmentedControl
          aria-label="Playground view"
          size="small"
          variant="soft"
          motion="slide"
          value={view}
          onValueChange={(value) => setView(value as View)}
        >
          <SegmentedControl.Item value="terminal">Terminal</SegmentedControl.Item>
          <SegmentedControl.Item value="logs">Simulated logs</SegmentedControl.Item>
          {import.meta.env.DEV && (
            <SegmentedControl.Item value="shell">Local Shell</SegmentedControl.Item>
          )}
        </SegmentedControl>
        <Popover className="appearance">
          <Popover.Trigger
            className="appearance-trigger"
            render={(props) => (
              <Button {...props} size="small" variant="outline" trailingIcon={<ChevronDownIcon size={14} />}>
                Appearance
              </Button>
            )}
          />
          <Popover.Content aria-label="Terminal appearance" placement="bottomEnd" className="appearance-panel">
            <div className="appearance-fields">
              <div className="appearance-field">
                <span id="appearance-font">Font</span>
                <Select size="small" value={font} onValueChange={(value) => setFont(value as keyof typeof fonts)}>
                  <Select.Trigger aria-labelledby="appearance-font" />
                  <Select.Content>
                    {Object.entries(fonts).map(([value, option]) => (
                      <Select.Option key={value} value={value}>{option.label}</Select.Option>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div className="appearance-field">
                <span id="appearance-size">Size</span>
                <Select size="small" value={fontSize} onValueChange={setFontSize}>
                  <Select.Trigger aria-labelledby="appearance-size" />
                  <Select.Content>
                    {sizes.map((size) => <Select.Option key={size} value={String(size)}>{size} px</Select.Option>)}
                  </Select.Content>
                </Select>
              </div>
              <div className="appearance-field">
                <span id="appearance-theme">Theme</span>
                <Select size="small" value={theme} onValueChange={(value) => setTheme(value as keyof typeof themes)}>
                  <Select.Trigger aria-labelledby="appearance-theme" />
                  <Select.Content>
                    {Object.entries(themes).map(([value, option]) => (
                      <Select.Option key={value} value={value}>{option.label}</Select.Option>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            </div>
          </Popover.Content>
        </Popover>
      </header>
      <main className="terminal-frame" style={{ backgroundColor: appearance.theme.background }}>
        {view === 'terminal' && <InteractiveTerminal appearance={appearance} />}
        {view === 'logs' && <SimulatedLogs appearance={appearance} />}
        {import.meta.env.DEV && view === 'shell' && <LocalShell appearance={appearance} />}
      </main>
    </>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Playground root element is missing.');

const app = createRoot(root);
void document.fonts.load(`${defaultFontSize}px ${monoFonts.jetbrainsMono.cssFamily}`, 'W')
  .catch(() => [])
  .then((faces) => app.render(
    <StrictMode>
      <Playground initialFont={faces.length ? 'jetbrains' : 'system'} />
    </StrictMode>,
  ));
