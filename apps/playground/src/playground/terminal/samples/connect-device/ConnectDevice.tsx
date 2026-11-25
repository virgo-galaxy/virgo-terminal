import { AppleIcon, DownloadIcon, MonitorIcon, WindowsIcon } from '@virgo-design/icons';
import { Button, Tooltip } from '@virgo-design/ui';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';
import type { DemoTerminalProps } from '../../types';
import { getLatestClientDownload, type ClientDownload } from './clientRelease';
import type { DeviceTicket } from './deviceTicket';
import { useDeviceConnection } from './useDeviceConnection';
import styles from './connect-device.module.css';

const downloads = {
  macos: { label: 'connectDevice.macos', filename: 'virgo-terminal-macos-universal.zip', icon: AppleIcon },
  windows: { label: 'connectDevice.windows', filename: 'virgo-terminal-windows-x64.exe', icon: WindowsIcon },
} as const;
const HighlightedCodeBlock = lazy(() => import('@/playground/HighlightedCodeBlock'));
type VersionHint = ClientDownload
  | 'connectDevice.checkingRelease'
  | 'connectDevice.downloadUnavailable'
  | 'connectDevice.downloadFailed';

function getClientPlatform(): keyof typeof downloads | null {
  const { userAgent, maxTouchPoints } = navigator;
  if (/Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent)) return null;
  if (/Windows NT/i.test(userAgent)) return 'windows';
  // iPadOS can send a desktop Mac user agent.
  if (/Macintosh/i.test(userAgent) && maxTouchPoints < 2) return 'macos';
  return null;
}

function renderInstruction(text: string) {
  return text.split(/\*\*([^*]+)\*\*/).map((part, index) => (
    index % 2 === 0 ? part : <strong key={index}>{part}</strong>
  ));
}

export function ConnectDevice({ options, ticket, visible }: {
  options: DemoTerminalProps;
  ticket: DeviceTicket | null;
  visible: boolean;
}) {
  const { locale, t } = usePlaygroundLocale();
  const terminal = useRef<TerminalHandle>(null);
  const downloadLookup = useRef<Promise<ClientDownload | null> | null>(null);
  const { status, connect, start, sendInput, sendSize } = useDeviceConnection(ticket, terminal);
  const [platform] = useState(getClientPlatform);
  const download = platform ? downloads[platform] : null;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<'unavailable' | 'failed' | null>(null);
  const [versionHint, setVersionHint] = useState<VersionHint>('connectDevice.checkingRelease');
  const [macHelpOpened, setMacHelpOpened] = useState(false);
  const needsSetup = status === 'idle' || status === 'failed' || status === 'denied';
  const hasLaunchTicket = status === 'idle' && ticket !== null;
  const canConnect = hasLaunchTicket || download !== null;
  const instructions = download ? 'connectDevice.instructions' : 'connectDevice.unsupportedPlatform';
  const macOpenCommand = `# ${t('connectDevice.macExtractStep')}
ditto -x -k "$HOME/Downloads/${downloads.macos.filename}" "$HOME/Downloads"

# ${t('connectDevice.macRemoveQuarantineStep')}
xattr -dr com.apple.quarantine "$HOME/Downloads/Virgo Terminal Client.app"

# ${t('connectDevice.macLaunchStep')}
open "$HOME/Downloads/Virgo Terminal Client.app"`;

  useEffect(() => {
    if (visible && status === 'connected') terminal.current?.focus();
  }, [visible, status]);

  function findClientDownload(filename: string) {
    if (downloadLookup.current) return downloadLookup.current;

    setVersionHint('connectDevice.checkingRelease');
    const request = getLatestClientDownload(filename);
    downloadLookup.current = request;
    void request.then(
      (release) => {
        if (downloadLookup.current === request) setVersionHint(release ?? 'connectDevice.downloadUnavailable');
      },
      () => {
        if (downloadLookup.current !== request) return;
        downloadLookup.current = null;
        setVersionHint('connectDevice.downloadFailed');
      },
    );
    return request;
  }

  async function downloadClient(filename: string) {
    setDownloading(true);
    setDownloadError(null);
    const request = findClientDownload(filename);
    try {
      const release = await request;
      if (release) {
        window.location.assign(release.url);
      } else {
        setDownloadError('unavailable');
      }
    } catch {
      setDownloadError('failed');
    } finally {
      if (downloadLookup.current === request) downloadLookup.current = null;
      setDownloading(false);
    }
  }

  return (
    <section className={styles.root} hidden={!visible} aria-label={t('toolbar.connectDevice')}>
      {needsSetup ? (
        <div className={styles.setup}>
          <h1>{t('toolbar.connectDevice')}</h1>
          <p>{renderInstruction(t(hasLaunchTicket ? 'connectDevice.authorize' : instructions))}</p>
          {canConnect && (
            <Button type="button" leadingIcon={<MonitorIcon aria-hidden="true" />} onClick={connect}>
              {t('connectDevice.connect')}
            </Button>
          )}
          {status !== 'idle' && <p className={styles.availability} role="status">{t(`connectDevice.${status}`)}</p>}
          {!hasLaunchTicket && download && (
            <>
              <ul className={styles.downloads}>
                <li>
                  <span className={styles.platform}>
                    <download.icon className={styles.platformIcon} aria-hidden="true" />
                    {t(download.label)}
                  </span>
                  <Tooltip
                    openDelay={300}
                    closeOnClick={false}
                    onOpenChange={(open) => {
                      if (open) void findClientDownload(download.filename);
                      else downloadLookup.current = null;
                    }}
                  >
                    <Tooltip.Trigger
                      disabled={downloading}
                      aria-busy={downloading}
                      onClick={() => void downloadClient(download.filename)}
                      aria-label={`${t('connectDevice.download')} ${t(download.label)}`}
                      render={(props) => (
                        <Button {...props} leadingIcon={<DownloadIcon aria-hidden="true" />} size="large" variant="outline">
                          {t(downloading ? 'connectDevice.checkingRelease' : 'connectDevice.download')}
                        </Button>
                      )}
                    />
                    <Tooltip.Content size="small">
                      {typeof versionHint === 'string'
                        ? t(versionHint)
                        : t('connectDevice.downloadVersion').replace('{version}', versionHint.version)}
                    </Tooltip.Content>
                  </Tooltip>
                  {platform === 'macos' && (
                    <details
                      className={styles.macHelp}
                      onToggle={(event) => {
                        if (event.currentTarget.open) setMacHelpOpened(true);
                      }}
                    >
                      <summary>{t('connectDevice.macOpenHelp')}</summary>
                      <p>
                        {renderInstruction(t('connectDevice.macOpenSettings'))}{' '}
                        <a href={`https://support.apple.com/${locale.toLowerCase()}/102445`} target="_blank" rel="noreferrer">
                          {t('connectDevice.macOpenAppleSupport')}
                        </a>
                      </p>
                      <p>{t('connectDevice.macOpenCommand')}</p>
                      {macHelpOpened && (
                        <Suspense fallback={<pre><code>{macOpenCommand}</code></pre>}>
                          <HighlightedCodeBlock key={macOpenCommand} code={macOpenCommand} language="bash" />
                        </Suspense>
                      )}
                    </details>
                  )}
                </li>
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
