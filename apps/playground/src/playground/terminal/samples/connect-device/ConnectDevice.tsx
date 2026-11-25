import { AppleIcon, DownloadIcon, MonitorIcon, WindowsIcon } from '@virgo-design/icons';
import { Button } from '@virgo-design/ui';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import { useEffect, useRef, useState } from 'react';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';
import type { DemoTerminalProps } from '../../types';
import { getLatestClientDownload } from './clientRelease';
import type { DeviceTicket } from './deviceTicket';
import { useDeviceConnection } from './useDeviceConnection';
import styles from './connect-device.module.css';

const downloads = [
  { label: 'connectDevice.macos', filename: 'virgo-terminal-macos-universal.zip', icon: AppleIcon },
  { label: 'connectDevice.windows', filename: 'virgo-terminal-windows-x64.exe', icon: WindowsIcon },
] as const;
const macOpenCommand = 'xattr -dr com.apple.quarantine "$HOME/Downloads/Virgo Terminal Client.app" && open "$HOME/Downloads/Virgo Terminal Client.app"';

export function ConnectDevice({ options, ticket, visible }: {
  options: DemoTerminalProps;
  ticket: DeviceTicket | null;
  visible: boolean;
}) {
  const { locale, t } = usePlaygroundLocale();
  const terminal = useRef<TerminalHandle>(null);
  const { status, connect, start, sendInput, sendSize } = useDeviceConnection(ticket, terminal);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<'unavailable' | 'failed' | null>(null);
  const needsSetup = status === 'idle' || status === 'failed' || status === 'denied';
  const hasLaunchTicket = status === 'idle' && ticket !== null;

  useEffect(() => {
    if (visible && status === 'connected') terminal.current?.focus();
  }, [visible, status]);

  async function downloadClient(filename: string) {
    setDownloading(filename);
    setDownloadError(null);
    try {
      const href = await getLatestClientDownload(filename);
      if (href) {
        window.location.assign(href);
      } else {
        setDownloadError('unavailable');
      }
    } catch {
      setDownloadError('failed');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section className={styles.root} hidden={!visible} aria-label={t('toolbar.connectDevice')}>
      {needsSetup ? (
        <div className={styles.setup}>
          <h1>{t('toolbar.connectDevice')}</h1>
          <p>{t(hasLaunchTicket ? 'connectDevice.authorize' : 'connectDevice.instructions')}</p>
          <Button type="button" leadingIcon={<MonitorIcon aria-hidden="true" />} onClick={connect}>
            {t('connectDevice.connect')}
          </Button>
          {status !== 'idle' && <p className={styles.availability} role="status">{t(`connectDevice.${status}`)}</p>}
          {!hasLaunchTicket && (
            <>
              <ul className={styles.downloads}>
                {downloads.map(({ label, filename, icon: PlatformIcon }) => (
                  <li key={filename}>
                    <span className={styles.platform}>
                      <PlatformIcon className={styles.platformIcon} aria-hidden="true" />
                      {t(label)}
                    </span>
                    <Button
                      type="button"
                      disabled={downloading !== null}
                      aria-busy={downloading === filename}
                      onClick={() => void downloadClient(filename)}
                      aria-label={`${t('connectDevice.download')} ${t(label)}`}
                      leadingIcon={<DownloadIcon aria-hidden="true" />}
                      size="small"
                      variant="outline"
                    >
                      {t(downloading === filename ? 'connectDevice.checkingRelease' : 'connectDevice.download')}
                    </Button>
                    {label === 'connectDevice.macos' && (
                      <details className={styles.macHelp}>
                        <summary>{t('connectDevice.macOpenHelp')}</summary>
                        <p>
                          {t('connectDevice.macOpenSettings')}{' '}
                          <a href={`https://support.apple.com/${locale.toLowerCase()}/102445`} target="_blank" rel="noreferrer">
                            {t('connectDevice.macOpenAppleSupport')}
                          </a>
                        </p>
                        <p>{t('connectDevice.macOpenCommand')}</p>
                        <pre><code>{macOpenCommand}</code></pre>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
              {downloadError && (
                <p className={styles.availability} role="status">
                  {t(downloadError === 'unavailable' ? 'connectDevice.downloadUnavailable' : 'connectDevice.downloadFailed')}
                </p>
              )}
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
              {status === 'exited' && (
                <Button type="button" size="small" onClick={connect}>{t('connectDevice.retry')}</Button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
