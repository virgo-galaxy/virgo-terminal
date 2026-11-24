import { useEffect, useRef, useState } from 'react';
import { PlayFilledIcon } from '@virgo-design/icons';
import { Button } from '@virgo-design/ui';
import { Terminal, type TerminalAppearance, type TerminalHandle, type TerminalScrollbar, type TerminalSize } from '@virgo-terminal/react';

function sendSize(connection: WebSocket | null, { cols, rows }: TerminalSize) {
  if (connection?.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify({ type: 'resize', cols, rows }));
  }
}

export function LocalShell({ appearance, copyOnSelect, onRestart, scrollbar, shellId, visible }: {
  appearance: TerminalAppearance;
  copyOnSelect: boolean;
  onRestart: () => void;
  scrollbar: TerminalScrollbar;
  shellId: string;
  visible: boolean;
}) {
  const terminal = useRef<TerminalHandle>(null);
  const [ready, setReady] = useState(false);
  const [closed, setClosed] = useState(false);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!ready) return;

    const endpoint = new URL('/local-shell', window.location.href);
    endpoint.protocol = 'ws:';
    const connection = new WebSocket(endpoint);
    socket.current = connection;

    connection.onopen = () => {
      const size = terminal.current?.getSize();
      if (size) connection.send(JSON.stringify({ type: 'start', shellId, ...size }));
    };
    connection.onmessage = (event) => {
      if (typeof event.data === 'string') terminal.current?.write(event.data);
    };
    connection.onclose = ({ code }) => {
      let message = 'Local shell disconnected';
      if (code === 1000) message = 'Shell exited';
      if (code === 1008) message = 'Selected shell is unavailable';
      if (code === 1011) message = 'Local shell failed';
      terminal.current?.write(`\r\n[${message}]\r\n`);
      setClosed(true);
    };

    return () => {
      socket.current = null;
      connection.onopen = null;
      connection.onmessage = null;
      connection.onclose = null;
      connection.close();
    };
  }, [ready, shellId]);

  useEffect(() => {
    if (ready && visible) terminal.current?.focus();
  }, [ready, visible]);

  return (
    <div className="terminal local-shell" hidden={!visible}>
      <Terminal
        appearance={{ ...appearance, cursorBlink: true }}
        autoFit
        className="local-shell-terminal"
        copyOnSelect={copyOnSelect}
        ref={terminal}
        scrollbar={scrollbar}
        onResize={(size) => sendSize(socket.current, size)}
        onReady={() => setReady(true)}
        onData={(data) => {
          const connection = socket.current;
          if (connection?.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify({ type: 'input', data }));
          }
        }}
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
            Start shell
          </Button>
        </div>
      )}
    </div>
  );
}
