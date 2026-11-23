import { useEffect, useRef, useState } from 'react';
import { Terminal, type TerminalAppearance, type TerminalHandle, type TerminalSize } from '@virgo-terminal/react';

function sendSize(connection: WebSocket | null, { cols, rows }: TerminalSize) {
  if (connection?.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify({ type: 'resize', cols, rows }));
  }
}

export function LocalShell({ appearance }: { appearance: TerminalAppearance }) {
  const terminal = useRef<TerminalHandle>(null);
  const [ready, setReady] = useState(false);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!ready) return;

    const endpoint = new URL('/local-shell', window.location.href);
    endpoint.protocol = 'ws:';
    const connection = new WebSocket(endpoint);
    socket.current = connection;

    connection.onopen = () => {
      const size = terminal.current?.getSize();
      if (size) sendSize(connection, size);
      terminal.current?.focus();
    };
    connection.onmessage = (event) => {
      if (typeof event.data === 'string') terminal.current?.write(event.data);
    };
    connection.onclose = ({ code }) => {
      let message = 'Local shell disconnected';
      if (code === 1000) message = 'Shell exited';
      if (code === 1011) message = 'Local shell failed';
      terminal.current?.write(`\r\n[${message}]\r\n`);
    };

    return () => {
      socket.current = null;
      connection.onopen = null;
      connection.onmessage = null;
      connection.onclose = null;
      connection.close();
    };
  }, [ready]);

  return (
    <Terminal
      appearance={{ ...appearance, cursorBlink: true }}
      autoFit
      className="terminal"
      ref={terminal}
      onResize={(size) => sendSize(socket.current, size)}
      onReady={() => setReady(true)}
      onData={(data) => {
        const connection = socket.current;
        if (connection?.readyState === WebSocket.OPEN) {
          connection.send(JSON.stringify({ type: 'input', data }));
        }
      }}
    />
  );
}
