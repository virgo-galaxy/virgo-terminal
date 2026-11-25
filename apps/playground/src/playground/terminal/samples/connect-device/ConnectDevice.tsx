import { AppleIcon, DownloadIcon, MonitorIcon, WindowsIcon } from '@virgo-design/icons';
import { Button } from '@virgo-design/ui';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import { useEffect, useRef } from 'react';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';
import type { DemoTerminalProps } from '../../types';
import type { DeviceTicket } from './deviceTicket';
import { useDeviceConnection } from './useDeviceConnection';
import styles from './connect-device.module.css';

const releaseTag = import.meta.env.VITE_LOCAL_CLIENT_RELEASE_TAG as string | undefined;
const downloads = [
  { label: 'connectDevice.macos', filename: 'virgo-terminal-macos-universal.zip', icon: AppleIcon },
  { label: 'connectDevice.windows', filename: 'virgo-terminal-windows-x64.exe', icon: WindowsIcon },
] as const;

export function ConnectDevice({ options, ticket, visible }: {
  options: DemoTerminalProps;
  ticket: DeviceTicket | null;
  visible: boolean;
}) {
  const { t } = usePlaygroundLocale();
  const terminal = useRef<TerminalHandle>(null);
  const { status, connect, start, sendInput, sendSize } = useDeviceConnection(ticket, terminal);

  useEffect(() => {
    if (visible && status === 'connected') terminal.current?.focus();
  }, [visible, status]);

  return (
    <section className={styles.root} hidden={!visible} aria-label={t('toolbar.connectDevice')}>
      {status === 'idle' ? (
        <div className={styles.setup}>
          <h1>{t('toolbar.connectDevice')}</h1>
          {ticket ? (
            <>
              <p>{t('connectDevice.authorize')}</p>
              <Button type="button" leadingIcon={<MonitorIcon aria-hidden="true" />} onClick={connect}>
                {t('connectDevice.connect')}
              </Button>
            </>
          ) : (
            <>
              <p>{t('connectDevice.instructions')}</p>
              <ul className={styles.downloads}>
                {downloads.map(({ label, filename, icon: PlatformIcon }) => {
                  const href = releaseTag
                    ? `https://github.com/virgo-galaxy/virgo-terminal/releases/download/${encodeURIComponent(releaseTag)}/${filename}`
                    : undefined;
                  return (
                    <li key={filename}>
                      <span className={styles.platform}>
                        <PlatformIcon className={styles.platformIcon} aria-hidden="true" />
                        {t(label)}
                      </span>
                      <Button
                        type="button"
                        disabled={!href}
                        onClick={() => {
                          if (href) window.location.assign(href);
                        }}
                        aria-label={`${t('connectDevice.download')} ${t(label)}`}
                        leadingIcon={<DownloadIcon aria-hidden="true" />}
                        size="small"
                        variant="outline"
                      >
                        {t('connectDevice.download')}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              {!releaseTag && <p className={styles.availability}>{t('connectDevice.unreleased')}</p>}
            </>
          )}
        </div>
      ) : (
        <div className={styles.session}>
          <div className={styles.terminal} style={{ backgroundColor: options.appearance.theme?.background }}>
            <Terminal
              {...options}
              appearance={{ ...options.appearance, cursorBlink: true }}
              autoFit
              className={styles.viewport!}
              readOnly={status !== 'connected'}
              ref={terminal}
              onReady={start}
              onData={sendInput}
              onResize={sendSize}
            />
          </div>
          {status !== 'connected' && (
            <div className={styles.status}>
              <span role="status">{t(`connectDevice.${status}`)}</span>
              {status !== 'connecting' && (
                <Button type="button" size="small" onClick={connect}>{t('connectDevice.retry')}</Button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
