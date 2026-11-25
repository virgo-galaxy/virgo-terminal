import { useEffect, useRef, useState } from 'react';
import { PlayFilledIcon } from '@virgo-design/icons';
import { Button } from '@virgo-design/ui';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';
import styles from '../../terminal.module.css';
import type { DemoTerminalProps } from '../../types';
import { useLocalShell } from './useLocalShell';

export function LocalShell({ appearance, copyOnSelect, onRestart, scrollbar, scrollback, shellId, visible }: DemoTerminalProps & {
  onRestart: () => void;
  shellId: string;
  visible: boolean;
}) {
  const { t } = usePlaygroundLocale();
  const terminal = useRef<TerminalHandle>(null);
  const [ready, setReady] = useState(false);
  const { closed, sendSize, sendInput } = useLocalShell(terminal, ready, shellId);

  useEffect(() => {
    if (ready && visible) terminal.current?.focus();
  }, [ready, visible]);

  return (
    <div className={styles.localShell} hidden={!visible}>
      <Terminal
        appearance={{ ...appearance, cursorBlink: true }}
        autoFit
        className={styles.localShellTerminal!}
        copyOnSelect={copyOnSelect}
        ref={terminal}
        scrollbar={scrollbar}
        scrollback={scrollback}
        onResize={sendSize}
        onReady={() => setReady(true)}
        onData={sendInput}
      />
      {closed && (
        <div className={styles.localShellActions}>
          <Button
            className={styles.startShellButton}
            size="small"
            variant="primary"
            leadingIcon={<PlayFilledIcon />}
            onClick={onRestart}
          >
            {t('shell.start')}
          </Button>
        </div>
      )}
    </div>
  );
}
