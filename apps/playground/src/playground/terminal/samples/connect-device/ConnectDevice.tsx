import { AppleIcon, DownloadIcon, WindowsIcon } from '@virgo-design/icons';
import { Button, Tooltip } from '@virgo-design/ui';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import { lazy, Suspense, useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { flushSync } from 'react-dom';
import type { MessageKey } from '@/i18n/locales/en-US';
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

function WaitingMessage({ text }: { text: string }) {
  const characters = Array.from(`${text}...`);

  return (
    <>
      <span className={styles.waitingAnnouncement}>{text}</span>
      <span className={styles.waitingMessage} aria-hidden="true" key={text}>
        {characters.map((character, index) => character === ' ' ? ' ' : (
          <span key={index} style={{ animationDelay: `${950 * index / (characters.length - 1)}ms` }}>
            {character}
          </span>
        ))}
      </span>
    </>
  );
}

export function ConnectDeviceGuide() {
  const { locale, t } = usePlaygroundLocale();
  const downloadLookup = useRef<Promise<ClientDownload | null> | null>(null);
  const platform = getClientPlatform();
  const download = platform ? downloads[platform] : null;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<'unavailable' | 'failed' | null>(null);
  const [versionHint, setVersionHint] = useState<VersionHint>('connectDevice.checkingRelease');
  const [macHelpOpened, setMacHelpOpened] = useState(false);
  const macOpenCommand = `# ${t('connectDevice.macExtractStep')}
ditto -x -k "$HOME/Downloads/${downloads.macos.filename}" "$HOME/Downloads"

# ${t('connectDevice.macRemoveQuarantineStep')}
xattr -dr com.apple.quarantine "$HOME/Downloads/Virgo Terminal Client.app"

# ${t('connectDevice.macLaunchStep')}
open "$HOME/Downloads/Virgo Terminal Client.app"`;

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
    <section className={styles.setup}>
      <h1>{t('toolbar.connectDevice')}</h1>
      <p>{renderInstruction(t(download ? 'connectDevice.instructions' : 'connectDevice.unsupportedPlatform'))}</p>
      {download && (
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
              <details
                className={styles.openHelp}
                onToggle={(event) => {
                  if (platform === 'macos' && event.currentTarget.open) setMacHelpOpened(true);
                }}
              >
                <summary>{t('connectDevice.openHelp')}</summary>
                {platform === 'macos' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <p>{renderInstruction(t('connectDevice.windowsOpenExecutable').replace('{filename}', download.filename))}</p>
                    <p>{renderInstruction(t('connectDevice.windowsOpenSmartScreen'))}</p>
                  </>
                )}
              </details>
            </li>
          </ul>
          {downloadError && (
            <p className={styles.availability} role="status">
              {t(downloadError === 'unavailable' ? 'connectDevice.downloadUnavailable' : 'connectDevice.downloadFailed')}
            </p>
          )}
        </>
      )}
    </section>
  );
}

export type ConnectDeviceHandle = { connect(): void };

export function ConnectDevice({ ref, options, ticket, visible }: {
  ref: Ref<ConnectDeviceHandle>;
  options: DemoTerminalProps;
  ticket: DeviceTicket | null;
  visible: boolean;
}) {
  const { t } = usePlaygroundLocale();
  const terminal = useRef<TerminalHandle>(null);
  const sessionPane = useRef<HTMLElement>(null);
  const canConnect = getClientPlatform() !== null || ticket !== null;
  const transitionSession = useCallback((update: () => void) => {
    if (sessionPane.current?.hidden !== false || document.visibilityState !== 'visible' || document.fullscreenElement
      || !document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update();
      return;
    }

    document.startViewTransition(() => flushSync(update));
  }, []);
  const { status, access, connectInClient, connect, start, sendInput, sendSize } = useDeviceConnection(
    ticket, terminal, canConnect, visible, transitionSession,
  );
  const hasSession = status === 'connected' || status === 'exited';
  const showTerminal = hasSession || status === 'starting';
  let statusMessage: MessageKey = 'connectDevice.waiting';
  if (status === 'authorizing' || status === 'denied') statusMessage = `connectDevice.${status}`;
  else if (status === 'connecting' || status === 'starting') statusMessage = 'connectDevice.connecting';
  else if (access === 'denied') statusMessage = 'connectDevice.browserAccessDenied';
  else if (access === 'prompt' || access === 'manual') statusMessage = 'connectDevice.browserAccess';

  useImperativeHandle(ref, () => ({ connect: () => connect() }), [connect]);

  useEffect(() => {
    if (visible && status === 'connected') terminal.current?.focus();
  }, [visible, status]);

  return (
    <section
      ref={sessionPane}
      className={styles.root}
      hidden={!visible}
      aria-label={t('toolbar.connectDevice')}
      data-fill-terminal={status === 'connected' || undefined}
    >
      {canConnect && !hasSession && (
        <p className={styles.waiting} role="status">
          {statusMessage === 'connectDevice.waiting'
            ? <WaitingMessage text={t(statusMessage)} />
            : renderInstruction(t(statusMessage))}
        </p>
      )}
      {showTerminal && (
        <div className={styles.session} data-starting={!hasSession || undefined} aria-hidden={!hasSession || undefined}>
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
          {status === 'exited' && (
            <div className={styles.status}>
              <span role="status">{t('connectDevice.exited')}</span>
              {!connectInClient && (
                <Button type="button" size="small" onClick={() => connect()}>{t('connectDevice.retry')}</Button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
