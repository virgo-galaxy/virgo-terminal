import { useEffect, useRef, useState } from 'react';
import { PlayFilledIcon } from '@virgo-design/icons';
import { Button } from '@virgo-design/ui';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import { usePlaygroundLocale } from '@/app/i18n/PlaygroundLocale';
import type { DemoTerminalProps } from '@/examples/types';
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
    <div className="demo-terminal local-shell" hidden={!visible}>
      <Terminal
        appearance={{ ...appearance, cursorBlink: true }}
        autoFit
        className="local-shell-terminal"
        copyOnSelect={copyOnSelect}
        ref={terminal}
        scrollbar={scrollbar}
        scrollback={scrollback}
        onResize={sendSize}
        onReady={() => setReady(true)}
        onData={sendInput}
      />
      {closed && (
        <div className="local-shell-actions">
          <Button
            className="start-shell-button"
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
