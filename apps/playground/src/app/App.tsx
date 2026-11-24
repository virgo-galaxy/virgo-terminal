import { useState } from 'react';
import { ExampleSource } from '@/code/ExampleSource';
import { InteractiveTerminal } from '@/examples/interactive-terminal/InteractiveTerminal';
import { LocalShell } from '@/examples/local-shell/LocalShell';
import { useShellOptions } from '@/examples/local-shell/useShellOptions';
import { SimulatedLogs } from '@/examples/simulated-logs/SimulatedLogs';
import type { DemoTerminalProps, ExampleView, Presentation } from '@/examples/types';
import { TerminalPreferences } from '@/preferences/TerminalPreferences';
import { defaultPreferences, fonts, themes, type TerminalPreferenceValues } from '@/preferences/preferences';
import { Toolbar } from './Toolbar';

type ShellSession = { attempt: number; shellId: string };

export function App({ initialFont }: { initialFont: TerminalPreferenceValues['font'] }) {
  const [view, setView] = useState<ExampleView>('terminal');
  const [presentation, setPresentation] = useState<Presentation>('preview');
  const [shellSession, setShellSession] = useState<ShellSession | null>(null);
  const [preferences, setPreferences] = useState<TerminalPreferenceValues>(
    () => ({ ...defaultPreferences, font: initialFont }),
  );
  const shellOptions = useShellOptions(defaultPreferences.shellId);
  const appearance = {
    fontFamily: fonts[preferences.font].family,
    fontSize: Number(preferences.fontSize),
    theme: themes[preferences.theme].colors,
  };
  const demoTerminalProps: DemoTerminalProps = {
    appearance,
    copyOnSelect: preferences.copyOnSelect,
    scrollbar: {
      visibility: preferences.scrollbarVisibility,
      thumbWidth: Number(preferences.scrollbarWidth),
      thumbRadius: Number(preferences.scrollbarRadius),
    },
    scrollback: Number(preferences.history),
  };

  function startShell() {
    setShellSession((session) => ({ attempt: (session?.attempt ?? 0) + 1, shellId: preferences.shellId }));
  }

  function selectExample(nextView: ExampleView, nextPresentation: Presentation) {
    setView(nextView);
    setPresentation(nextPresentation);
    if (nextView === 'shell' && nextPresentation === 'preview' && !shellSession) startShell();
  }

  return (
    <>
      <Toolbar view={view} presentation={presentation} onSelectExample={selectExample}>
        <TerminalPreferences
          preferences={preferences}
          shellOptions={shellOptions}
          onChange={(change) => setPreferences((current) => ({ ...current, ...change }))}
          onRestoreDefaults={() => setPreferences({ ...defaultPreferences, font: initialFont })}
        />
      </Toolbar>
      <main
        className="terminal-frame"
        style={presentation === 'preview' ? { backgroundColor: appearance.theme.background } : undefined}
      >
        <div className="example-preview" hidden={presentation !== 'preview'}>
          {view === 'terminal' && <InteractiveTerminal {...demoTerminalProps} visible={presentation === 'preview'} />}
          {view === 'logs' && <SimulatedLogs {...demoTerminalProps} showBackToTop={preferences.showBackToTop} />}
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
