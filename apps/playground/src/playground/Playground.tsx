import { lazy, useEffect, useRef, useState } from 'react';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';
import { Layout } from '@/layout/Layout';
import { ConnectDevice } from './terminal/samples/connect-device/ConnectDevice';
import { clearLaunchTicket, readDeviceTicket } from './terminal/samples/connect-device/deviceTicket';
import { Terminal, type ShellSession } from './terminal/Terminal';
import type { DemoTerminalProps } from './terminal/types';
import { defaultPreferences, fonts, themes, type TerminalPreferenceValues } from './toolbar/preferences/preferences';
import { Toolbar } from './toolbar/Toolbar';
import { showLocalShellDemo, type PlaygroundView } from './views';

const Guide = lazy(() => import('./guides/Guide'));

export function Playground({ initialFont }: { initialFont: TerminalPreferenceValues['font'] }) {
  const [deviceTicket] = useState(() => showLocalShellDemo ? null : readDeviceTicket());
  const [view, setView] = useState<PlaygroundView>(deviceTicket ? 'connect-device' : 'terminal');
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

  useEffect(() => {
    if (!showLocalShellDemo) clearLaunchTicket();
  }, []);

  function startShell() {
    setShellSession((session) => ({ attempt: (session?.attempt ?? 0) + 1, shellId: preferences.shellId }));
  }

  function selectExample(nextView: PlaygroundView) {
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
      guide={view === 'connect-device' ? null : <Guide view={view} locale={locale} />}
      guideKey={view}
      terminalStyle={view === 'connect-device' ? {} : { backgroundColor: appearance.theme.background }}
      terminal={(
        <>
          {view !== 'connect-device' && (
            <Terminal
              view={view}
              options={demoTerminalProps}
              showBackToTop={preferences.showBackToTop}
              shellSession={shellSession}
              onRestartShell={startShell}
            />
          )}
          {!showLocalShellDemo && (
            <ConnectDevice options={demoTerminalProps} ticket={deviceTicket} visible={view === 'connect-device'} />
          )}
        </>
      )}
    />
  );
}
