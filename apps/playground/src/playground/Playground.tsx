import { lazy, useRef, useState } from 'react';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';
import { Layout } from '@/layout/Layout';
import { Terminal, type ShellSession } from './terminal/Terminal';
import type { DemoTerminalProps, ExampleView } from './terminal/types';
import { defaultPreferences, fonts, themes, type TerminalPreferenceValues } from './toolbar/preferences/preferences';
import { Toolbar } from './toolbar/Toolbar';

const Guide = lazy(() => import('./guides/Guide'));

export function Playground({ initialFont }: { initialFont: TerminalPreferenceValues['font'] }) {
  const [view, setView] = useState<ExampleView>('terminal');
  const { locale } = usePlaygroundLocale();
  const content = useRef<HTMLDivElement>(null);
  const [shellSession, setShellSession] = useState<ShellSession | null>(null);
  const [preferences, setPreferences] = useState<TerminalPreferenceValues>(
    () => ({ ...defaultPreferences, font: initialFont }),
  );
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
    content.current?.scrollTo(0, 0);
    setView(nextView);
    if (nextView === 'shell' && !shellSession) startShell();
  }

  return (
    <Layout
      containerRef={content}
      header={(
        <Toolbar
          view={view}
          onSelectExample={selectExample}
          preferences={preferences}
          onPreferencesChange={(change) => setPreferences((current) => ({ ...current, ...change }))}
          onRestoreDefaults={() => setPreferences({ ...defaultPreferences, font: initialFont })}
        />
      )}
      guide={view !== 'shell' && <Guide view={view} locale={locale} />}
      guideKey={view}
      terminalStyle={{ backgroundColor: appearance.theme.background }}
      terminal={(
        <Terminal
          view={view}
          options={demoTerminalProps}
          showBackToTop={preferences.showBackToTop}
          shellSession={shellSession}
          onRestartShell={startShell}
        />
      )}
    />
  );
}
