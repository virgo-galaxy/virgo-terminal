import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { monoFonts } from '@virgo-design/fonts';
import { CodeIcon, MonitorIcon, SettingsIcon } from '@virgo-design/icons';
import { Button, Drawer, SegmentedControl, Select, Separator, Switch } from '@virgo-design/ui';
import type { TerminalAppearance, TerminalScrollbar } from '@virgo-terminal/react';
import '@virgo-design/fonts/sans/inter.css';
import '@virgo-design/fonts/mono/jetbrains-mono.css';
import '@virgo-design/tokens/styles.css';
import '@virgo-design/themes/virgo.css';
import '@virgo-design/ui/styles.css';
import '@virgo-terminal/react/styles.css';
import './playground.css';
import terminalLogo from './assets/virgo-terminal-logo.svg';
import type { DemoTerminalProps } from './demo-terminal-props';
import { ExampleSource, type ExampleView } from './ExampleSource';
import { InteractiveTerminal } from './InteractiveTerminal';
import { LocalShell } from './LocalShell';
import { SimulatedLogs } from './SimulatedLogs';

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

type Presentation = 'preview' | 'code';
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
  const [view, setView] = useState<ExampleView>('terminal');
  const [presentation, setPresentation] = useState<Presentation>('preview');
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

  function selectExample(nextView: ExampleView, nextPresentation: Presentation) {
    setView(nextView);
    setPresentation(nextPresentation);
    if (nextView === 'shell' && nextPresentation === 'preview' && !shellSession) startShell();
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
          onValueChange={(value) => selectExample(value as ExampleView, presentation)}
        >
          <SegmentedControl.Item value="terminal">Terminal</SegmentedControl.Item>
          <SegmentedControl.Item value="logs">Simulated logs</SegmentedControl.Item>
          {import.meta.env.DEV && (
            <SegmentedControl.Item value="shell">Local Shell</SegmentedControl.Item>
          )}
        </SegmentedControl>
        <div className="toolbar-actions">
          <SegmentedControl
            aria-label="Example presentation"
            size="small"
            variant="soft"
            motion="slide"
            value={presentation}
            onValueChange={(value) => selectExample(view, value === 'code' ? 'code' : 'preview')}
          >
            <SegmentedControl.Item value="preview" icon={<MonitorIcon />}>Preview</SegmentedControl.Item>
            <SegmentedControl.Item value="code" icon={<CodeIcon />}>Code</SegmentedControl.Item>
          </SegmentedControl>
          <Drawer>
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
        </div>
      </header>
      <main
        className="terminal-frame"
        style={presentation === 'preview' ? { backgroundColor: appearance.theme.background } : undefined}
      >
        <div className="example-preview" hidden={presentation !== 'preview'}>
          {view === 'terminal' && <InteractiveTerminal {...demoTerminalProps} visible={presentation === 'preview'} />}
          {view === 'logs' && <SimulatedLogs {...demoTerminalProps} showBackToTop={showBackToTop} />}
          {import.meta.env.DEV && shellSession && (
            <LocalShell
              key={shellSession.attempt}
              {...demoTerminalProps}
              onRestart={startShell}
              shellId={shellSession.shellId}
              visible={view === 'shell' && presentation === 'preview'}
            />
          )}
        </div>
        {presentation === 'code' && <ExampleSource key={view} view={view} />}
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
