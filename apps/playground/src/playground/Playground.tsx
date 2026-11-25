import { lazy, Suspense, useRef, useState } from 'react';
import { Layout } from '@virgo-design/ui';
import { InteractiveTerminal } from '@/examples/interactive-terminal/InteractiveTerminal';
import { LocalShell } from '@/examples/local-shell/LocalShell';
import { useShellOptions } from '@/examples/local-shell/useShellOptions';
import { SimulatedLogs } from '@/examples/simulated-logs/SimulatedLogs';
import type { DemoTerminalProps, ExampleView } from '@/examples/types';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';
import { TerminalPreferences } from '@/preferences/TerminalPreferences';
import { defaultPreferences, fonts, themes, type TerminalPreferenceValues } from '@/preferences/preferences';
import { SplitView } from './SplitView';
import { Toolbar } from './Toolbar';
import './playground.css';

type ShellSession = { attempt: number; shellId: string };
const ExampleGuide = lazy(() => import('@/guides/ExampleGuide'));

export function Playground({ initialFont }: { initialFont: TerminalPreferenceValues['font'] }) {
  const [view, setView] = useState<ExampleView>('terminal');
  const { locale, t } = usePlaygroundLocale();
  const splitView = useRef<HTMLDivElement>(null);
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
    splitView.current?.scrollTo(0, 0);
    setView(nextView);
    if (nextView === 'shell' && !shellSession) startShell();
  }

  return (
    <Layout className="playground">
      <Layout.Header height="var(--vd-sizing-28)" paddingInline={0}>
        <Toolbar view={view} onSelectExample={selectExample}>
          <TerminalPreferences
            preferences={preferences}
            shellOptions={shellOptions}
            onChange={(change) => setPreferences((current) => ({ ...current, ...change }))}
            onRestoreDefaults={() => setPreferences({ ...defaultPreferences, font: initialFont })}
          />
        </Toolbar>
      </Layout.Header>
      <Layout.Content className="playground-content">
        <SplitView
          containerRef={splitView}
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
      </Layout.Content>
    </Layout>
  );
}
