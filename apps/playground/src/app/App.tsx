import { lazy, Suspense, useRef, useState } from 'react';
import { InteractiveTerminal } from '@/examples/interactive-terminal/InteractiveTerminal';
import { LocalShell } from '@/examples/local-shell/LocalShell';
import { useShellOptions } from '@/examples/local-shell/useShellOptions';
import { SimulatedLogs } from '@/examples/simulated-logs/SimulatedLogs';
import type { DemoTerminalProps, ExampleView } from '@/examples/types';
import { TerminalPreferences } from '@/preferences/TerminalPreferences';
import { defaultPreferences, fonts, themes, type TerminalPreferenceValues } from '@/preferences/preferences';
import { PlaygroundLayout } from './PlaygroundLayout';
import { Toolbar } from './Toolbar';
import { usePlaygroundLocale } from './i18n/PlaygroundLocale';

type ShellSession = { attempt: number; shellId: string };
const ExampleGuide = lazy(() => import('@/guides/ExampleGuide'));

export function App({ initialFont }: { initialFont: TerminalPreferenceValues['font'] }) {
  const [view, setView] = useState<ExampleView>('terminal');
  const { locale, t } = usePlaygroundLocale();
  const layout = useRef<HTMLElement>(null);
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

  function selectExample(nextView: ExampleView) {
    layout.current?.scrollTo(0, 0);
    setView(nextView);
    if (nextView === 'shell' && !shellSession) startShell();
  }

  return (
    <>
      <Toolbar view={view} onSelectExample={selectExample}>
        <TerminalPreferences
          preferences={preferences}
          shellOptions={shellOptions}
          onChange={(change) => setPreferences((current) => ({ ...current, ...change }))}
          onRestoreDefaults={() => setPreferences({ ...defaultPreferences, font: initialFont })}
        />
      </Toolbar>
      <PlaygroundLayout
        view={view}
        layoutRef={layout}
        terminal={(
          <div className="terminal-frame" style={{ backgroundColor: appearance.theme.background }}>
            {view === 'terminal' && <InteractiveTerminal {...demoTerminalProps} />}
            {view === 'logs' && <SimulatedLogs {...demoTerminalProps} showBackToTop={preferences.showBackToTop} />}
            {import.meta.env.DEV && shellSession && (
              <LocalShell
                key={shellSession.attempt}
                {...demoTerminalProps}
                onRestart={startShell}
                shellId={shellSession.shellId}
                visible={view === 'shell'}
              />
            )}
          </div>
        )}
        guide={view !== 'shell' && (
          <div className="guide-frame" id="playground-guide" key={view}>
            <Suspense fallback={<p className="guide-loading" role="status">{t('guide.loading')}</p>}>
              <ExampleGuide view={view} locale={locale} />
            </Suspense>
          </div>
        )}
      />
    </>
  );
}
