import { lazy, useEffect, useRef, useState } from 'react';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';
import { Layout } from '@/layout/Layout';
import { ConnectDevice, ConnectDeviceGuide, type ConnectDeviceHandle } from './terminal/samples/connect-device/ConnectDevice';
import { clearLaunchTicket, readDeviceTicket } from './terminal/samples/connect-device/deviceTicket';
import { Terminal, type ShellSession } from './terminal/Terminal';
import type { DemoTerminalProps } from './terminal/types';
import { defaultPreferences, fonts, themes, type TerminalPreferenceValues } from './toolbar/preferences/preferences';
import { Toolbar } from './toolbar/Toolbar';
import type { PlaygroundView } from './views';

const Guide = lazy(() => import('./guides/Guide'));

export function Playground({ initialFont }: { initialFont: TerminalPreferenceValues['font'] }) {
  const [deviceTicket] = useState(readDeviceTicket);
  const [view, setView] = useState<PlaygroundView>(() => {
    const requestedDevice = new URLSearchParams(window.location.search).get('view') === 'connect-device';
    return deviceTicket || requestedDevice ? 'connect-device' : 'terminal';
  });
  const { locale } = usePlaygroundLocale();
  const isConnectDevice = view === 'connect-device';
  const content = useRef<HTMLDivElement>(null);
  const terminalPane = useRef<HTMLDivElement>(null);
  const device = useRef<ConnectDeviceHandle>(null);
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

  useEffect(clearLaunchTicket, []);

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
      terminalRef={terminalPane}
      header={(
        <Toolbar
          view={view}
          onSelectExample={selectExample}
          onConnectDevice={() => device.current?.connect()}
          onFullscreen={document.fullscreenEnabled ? () => {
            void terminalPane.current?.requestFullscreen().catch(console.error);
          } : undefined}
          preferences={preferences}
          onPreferencesChange={(change) => setPreferences((current) => ({ ...current, ...change }))}
          onRestoreDefaults={() => setPreferences({ ...defaultPreferences, font: initialFont })}
        />
      )}
      guide={isConnectDevice ? <ConnectDeviceGuide /> : <Guide view={view} locale={locale} />}
      guideKey={view}
      stacked={isConnectDevice}
      terminalStyle={{ backgroundColor: isConnectDevice ? undefined : appearance.theme.background }}
      terminal={(
        <>
          <Terminal
            view={view}
            options={demoTerminalProps}
            showBackToTop={preferences.showBackToTop}
            shellSession={shellSession}
            onRestartShell={startShell}
          />
          <ConnectDevice
            ref={device}
            options={demoTerminalProps}
            ticket={deviceTicket}
            visible={isConnectDevice}
          />
        </>
      )}
    />
  );
}
