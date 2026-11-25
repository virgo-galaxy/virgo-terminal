import { useEffect, useRef, useState, type RefObject } from 'react';
import type { TerminalHandle, TerminalSize } from '@virgo-terminal/react';

export function useLocalShell(terminal: RefObject<TerminalHandle | null>, ready: boolean, shellId: string) {
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
  }, [ready, shellId, terminal]);

  function sendSize({ cols, rows }: TerminalSize) {
    const connection = socket.current;
    if (connection?.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify({ type: 'resize', cols, rows }));
    }
  }

  function sendInput(data: string) {
    const connection = socket.current;
    if (connection?.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify({ type: 'input', data }));
    }
  }

  return { closed, sendSize, sendInput };
}
