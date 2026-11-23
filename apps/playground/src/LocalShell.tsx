import { useEffect, useRef, useState } from 'react';
import { Terminal, type TerminalAppearance, type TerminalProps, type TerminalSize } from '@virgo-terminal/react';

type Xterm = Parameters<NonNullable<TerminalProps['onReady']>>[0];

function sendSize(connection: WebSocket | null, { cols, rows }: TerminalSize) {
  if (connection?.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify({ type: 'resize', cols, rows }));
  }
}

export function LocalShell({ appearance }: { appearance: TerminalAppearance }) {
  const [terminal, setTerminal] = useState<Xterm | null>(null);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminal) return;

    const endpoint = new URL('/local-shell', window.location.href);
    endpoint.protocol = 'ws:';
    const connection = new WebSocket(endpoint);
    socket.current = connection;

    connection.onopen = () => {
      sendSize(connection, terminal);
      terminal.focus();
    };
    connection.onmessage = (event) => {
      if (typeof event.data === 'string') terminal.write(event.data);
    };
    connection.onclose = ({ code }) => {
      let message = 'Local shell disconnected';
      if (code === 1000) message = 'Shell exited';
      if (code === 1011) message = 'Local shell failed';
      terminal.write(`\r\n[${message}]\r\n`);
    };

    return () => {
      socket.current = null;
      connection.onopen = null;
      connection.onmessage = null;
      connection.onclose = null;
      connection.close();
    };
  }, [terminal]);

  return (
    <Terminal
      appearance={appearance}
      autoFit
      className="terminal"
      onResize={(size) => sendSize(socket.current, size)}
      onReady={(xterm) => {
        xterm.options.cursorBlink = true;
        setTerminal(xterm);
      }}
      onData={(data) => {
        const connection = socket.current;
        if (connection?.readyState === WebSocket.OPEN) {
          connection.send(JSON.stringify({ type: 'input', data }));
        }
      }}
    />
  );
}
