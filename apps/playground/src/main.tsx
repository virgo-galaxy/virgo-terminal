import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { monoFonts } from '@virgo-design/fonts';
import { ArrowUpIcon, SettingsIcon } from '@virgo-design/icons';
import { Button, Drawer, SegmentedControl, Select, Separator, Switch } from '@virgo-design/ui';
import { Terminal, type TerminalAppearance, type TerminalHandle, type TerminalScrollbar } from '@virgo-terminal/react';
import '@virgo-design/fonts/sans/inter.css';
import '@virgo-design/fonts/mono/jetbrains-mono.css';
import '@virgo-design/tokens/styles.css';
import '@virgo-design/themes/virgo.css';
import '@virgo-design/ui/styles.css';
import '@virgo-terminal/react/styles.css';
import './playground.css';
import terminalLogo from './assets/virgo-terminal-logo.svg';
import { LocalShell } from './LocalShell';

const prompt = '[root@localhost] # ~ ';
const loadedAt = new Date();
const loginDate = loadedAt.toDateString().slice(0, 10);
const loginTime = loadedAt.toTimeString().slice(0, 8);
const loginMessage = `Last login: ${loginDate} ${loginTime} on ttys001`;

type DemoTerminalProps = {
  appearance: TerminalAppearance;
  copyOnSelect: boolean;
  scrollbar: TerminalScrollbar;
  scrollback: number;
};

function InteractiveTerminal({ appearance, copyOnSelect, scrollbar, scrollback }: DemoTerminalProps) {
  const terminal = useRef<TerminalHandle>(null);
  const inputLength = useRef(0);

  return (
    <Terminal
      appearance={{ ...appearance, cursorBlink: true }}
      autoFit
      className="terminal"
      copyOnSelect={copyOnSelect}
      ref={terminal}
      scrollbar={scrollbar}
      scrollback={scrollback}
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

function SimulatedLogs({ appearance, copyOnSelect, scrollbar, scrollback, showBackToTop }: DemoTerminalProps & {
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

const fonts = {
  jetbrains: { label: monoFonts.jetbrainsMono.name, family: `${monoFonts.jetbrainsMono.cssFamily}, monospace` },
  system: { label: 'System monospace', family: 'monospace' },
  console: { label: 'Monaco / Consolas', family: 'Monaco, Consolas, monospace' },
  courier: { label: 'Courier New', family: '"Courier New", monospace' },
};

const defaultFontSize = 15;
const sizes = [12, 14, 15, 16, 18, 20, 24];
const scrollbarWidths = [4, 6, 8, 10, 12, 14];
const scrollbarRadii = [0, 2, 3, 5, 7];
const historyLimits = [0, 500, 1000, 5000, 10000];
type ScrollbarVisibility = NonNullable<TerminalScrollbar['visibility']>;

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
type ShellOption = { id: string; label: string };
type ShellSession = { attempt: number; shellId: string };

const defaultShellOption = { id: 'system', label: 'System default' };
const defaultPreferences = {
  fontSize: String(defaultFontSize),
  theme: 'classic' as const,
  scrollbarVisibility: 'auto' as const,
  scrollbarWidth: '6',
  scrollbarRadius: '3',
  history: '1000',
  copyOnSelect: false,
  showBackToTop: false,
  shellId: defaultShellOption.id,
};

function Playground({ initialFont }: { initialFont: keyof typeof fonts }) {
  const [view, setView] = useState<View>('terminal');
  const [shellSession, setShellSession] = useState<ShellSession | null>(null);
  const [shellOptions, setShellOptions] = useState<ShellOption[]>([defaultShellOption]);
  const [shellId, setShellId] = useState(defaultPreferences.shellId);
  const [font, setFont] = useState(initialFont);
  const [fontSize, setFontSize] = useState(defaultPreferences.fontSize);
  const [theme, setTheme] = useState<keyof typeof themes>(defaultPreferences.theme);
  const [scrollbarVisibility, setScrollbarVisibility] = useState<ScrollbarVisibility>(defaultPreferences.scrollbarVisibility);
  const [scrollbarWidth, setScrollbarWidth] = useState(defaultPreferences.scrollbarWidth);
  const [scrollbarRadius, setScrollbarRadius] = useState(defaultPreferences.scrollbarRadius);
  const [history, setHistory] = useState(defaultPreferences.history);
  const [copyOnSelect, setCopyOnSelect] = useState(defaultPreferences.copyOnSelect);
  const [showBackToTop, setShowBackToTop] = useState(defaultPreferences.showBackToTop);
  const appearance = { fontFamily: fonts[font].family, fontSize: Number(fontSize), theme: themes[theme].colors };
  const demoTerminalProps: DemoTerminalProps = {
    appearance,
    copyOnSelect,
    scrollbar: {
      visibility: scrollbarVisibility,
      thumbWidth: Number(scrollbarWidth),
      thumbRadius: Number(scrollbarRadius),
    },
    scrollback: Number(history),
  };

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const request = new AbortController();
    void fetch('/local-shell/options', { signal: request.signal }).then(async (response) => {
      if (response.ok) {
        const options: ShellOption[] = await response.json();
        setShellOptions(options);
      }
    }).catch(() => {});
    return () => request.abort();
  }, []);

  function startShell() {
    setShellSession((session) => ({ attempt: (session?.attempt ?? 0) + 1, shellId }));
  }

  function restoreDefaults() {
    setFont(initialFont);
    setFontSize(defaultPreferences.fontSize);
    setTheme(defaultPreferences.theme);
    setScrollbarVisibility(defaultPreferences.scrollbarVisibility);
    setScrollbarWidth(defaultPreferences.scrollbarWidth);
    setScrollbarRadius(defaultPreferences.scrollbarRadius);
    setHistory(defaultPreferences.history);
    setCopyOnSelect(defaultPreferences.copyOnSelect);
    setShowBackToTop(defaultPreferences.showBackToTop);
    setShellId(defaultPreferences.shellId);
  }

  return (
    <>
      <header className="toolbar">
        <img src={terminalLogo} alt="Virgo Terminal" width={24} height={24} />
        <SegmentedControl
          aria-label="Playground view"
          size="small"
          variant="soft"
          motion="slide"
          value={view}
          onValueChange={(value) => {
            setView(value as View);
            if (value === 'shell' && !shellSession) startShell();
          }}
        >
          <SegmentedControl.Item value="terminal">Terminal</SegmentedControl.Item>
          <SegmentedControl.Item value="logs">Simulated logs</SegmentedControl.Item>
          {import.meta.env.DEV && (
            <SegmentedControl.Item value="shell">Local Shell</SegmentedControl.Item>
          )}
        </SegmentedControl>
        <Drawer className="preferences">
          <Drawer.Trigger
            render={(props) => (
              <Button {...props} size="small" variant="outline" iconOnly aria-label="Terminal preferences">
                <SettingsIcon aria-hidden="true" />
              </Button>
            )}
          />
          <Drawer.Portal>
            <Drawer.Overlay />
            <Drawer.Content placement="right" size="sm">
              <Drawer.Header>
                <Drawer.Title>Terminal preferences</Drawer.Title>
                <Drawer.Close aria-label="Close preferences" />
              </Drawer.Header>
              <Drawer.Body className="preferences-body">
                <section className="preferences-section" aria-labelledby="appearance-heading">
                  <h3 id="appearance-heading">Appearance</h3>
                  <div className="preference-field">
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
                  <div className="preference-field">
                    <span id="appearance-size">Size</span>
                    <Select size="small" value={fontSize} onValueChange={setFontSize}>
                      <Select.Trigger aria-labelledby="appearance-size" />
                      <Select.Content>
                        {sizes.map((size) => <Select.Option key={size} value={String(size)}>{size} px</Select.Option>)}
                      </Select.Content>
                    </Select>
                  </div>
                  <div className="preference-field">
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
                  <div className="preferences-section scrollbar-preferences" role="group" aria-labelledby="scrollbar-heading">
                    <h4 id="scrollbar-heading">Scrollbar</h4>
                    <div className="preference-field">
                      <span id="scrollbar-display">Display</span>
                      <Select size="small" value={scrollbarVisibility} onValueChange={(value) => setScrollbarVisibility(value as ScrollbarVisibility)}>
                        <Select.Trigger aria-labelledby="scrollbar-heading scrollbar-display" />
                        <Select.Content>
                          <Select.Option value="auto">Automatic</Select.Option>
                          <Select.Option value="hidden">Hidden</Select.Option>
                        </Select.Content>
                      </Select>
                    </div>
                    <div className="preference-field">
                      <span id="scrollbar-width">Width</span>
                      <Select size="small" value={scrollbarWidth} onValueChange={setScrollbarWidth}>
                        <Select.Trigger aria-labelledby="scrollbar-heading scrollbar-width" />
                        <Select.Content>
                          {scrollbarWidths.map((width) => <Select.Option key={width} value={String(width)}>{width} px</Select.Option>)}
                        </Select.Content>
                      </Select>
                    </div>
                    <div className="preference-field">
                      <span id="scrollbar-radius">Radius</span>
                      <Select size="small" value={scrollbarRadius} onValueChange={setScrollbarRadius}>
                        <Select.Trigger aria-labelledby="scrollbar-heading scrollbar-radius" />
                        <Select.Content>
                          {scrollbarRadii.map((radius) => <Select.Option key={radius} value={String(radius)}>{radius} px</Select.Option>)}
                        </Select.Content>
                      </Select>
                    </div>
                  </div>
                </section>
                <Separator decorative />
                <section className="preferences-section" aria-labelledby="settings-heading">
                  <h3 id="settings-heading">Settings</h3>
                  <Switch className="preference-switch" checked={copyOnSelect} onCheckedChange={setCopyOnSelect}>
                    Copy on select
                  </Switch>
                  <Switch className="preference-switch" checked={showBackToTop} onCheckedChange={setShowBackToTop}>
                    Back to top in logs
                  </Switch>
                  <div className="preference-field">
                    <span id="history-label">History</span>
                    <Select size="small" value={history} onValueChange={setHistory}>
                      <Select.Trigger aria-labelledby="history-label" />
                      <Select.Content>
                        {historyLimits.map((limit) => (
                          <Select.Option key={limit} value={String(limit)}>
                            {limit === 0 ? 'Screen only' : `${limit.toLocaleString('en-US')} lines`}
                          </Select.Option>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                  {import.meta.env.DEV && (
                    <>
                      <div className="preference-field">
                        <span id="local-shell-label">Shell</span>
                        <Select size="small" value={shellId} onValueChange={setShellId}>
                          <Select.Trigger aria-labelledby="local-shell-label" aria-describedby="local-shell-hint" />
                          <Select.Content>
                            {shellOptions.map(({ id, label }) => (
                              <Select.Option key={id} value={id}>{label}</Select.Option>
                            ))}
                          </Select.Content>
                        </Select>
                      </div>
                      <p id="local-shell-hint" className="shell-preference-hint">Applies to the next shell session.</p>
                    </>
                  )}
                </section>
              </Drawer.Body>
              <Drawer.Footer>
                <Button type="button" size="small" variant="outline" onClick={restoreDefaults}>
                  Restore defaults
                </Button>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer>
      </header>
      <main className="terminal-frame" style={{ backgroundColor: appearance.theme.background }}>
        {view === 'terminal' && <InteractiveTerminal {...demoTerminalProps} />}
        {view === 'logs' && <SimulatedLogs {...demoTerminalProps} showBackToTop={showBackToTop} />}
        {import.meta.env.DEV && shellSession && (
          <LocalShell
            key={shellSession.attempt}
            {...demoTerminalProps}
            onRestart={startShell}
            shellId={shellSession.shellId}
            visible={view === 'shell'}
          />
        )}
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
