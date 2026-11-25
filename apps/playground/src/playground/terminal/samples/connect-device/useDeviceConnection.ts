import { useEffect, useRef, useState, type RefObject } from 'react';
import type { TerminalHandle, TerminalSize } from '@virgo-terminal/react';
import { saveDeviceTicket, type DeviceTicket } from './deviceTicket';

type Status = 'idle' | 'connecting' | 'connected' | 'exited' | 'failed';

type Connection = {
  socket: WebSocket;
  started: boolean;
};

export function useDeviceConnection(ticket: DeviceTicket | null, terminal: RefObject<TerminalHandle | null>) {
  const [status, setStatus] = useState<Status>('idle');
  const active = useRef<Connection | null>(null);
  const sessionKey = useRef(ticket?.key);

  useEffect(() => () => {
    const connection = active.current;
    active.current = null;
    connection?.socket.close();
  }, []);

  function start() {
    const connection = active.current;
    const size = terminal.current?.getSize();
    if (!connection || connection.started || connection.socket.readyState !== WebSocket.OPEN || !size) return;

    connection.socket.send(JSON.stringify({ type: 'start', key: sessionKey.current, ...size }));
    connection.started = true;
  }

  function connect() {
    if (!ticket || active.current) return;

    // Start the connection from the click so the browser can request local access.
    const socket = new WebSocket(`ws://127.0.0.1:${ticket.port}/local-shell`, 'virgo-terminal.v1');
    const connection = { socket, started: false };
    socket.binaryType = 'arraybuffer';
    active.current = connection;
    setStatus('connecting');

    socket.onopen = () => {
      terminal.current?.write('\x1bc');
      start();
    };
    socket.onmessage = ({ data }) => {
      if (active.current !== connection) return;
      if (data instanceof ArrayBuffer) {
        terminal.current?.write(new Uint8Array(data));
      } else if (typeof data === 'string') {
        try {
          const reply = JSON.parse(data) as { type?: unknown; key?: unknown } | null;
          if (reply?.type !== 'ready' || typeof reply.key !== 'string' || !/^[a-f0-9]{64}$/.test(reply.key)) return;
          sessionKey.current = reply.key;
          saveDeviceTicket({ port: ticket.port, key: reply.key });
          setStatus('connected');
        } catch {
          socket.close();
        }
      }
    };
    socket.onclose = ({ code }) => {
      if (active.current !== connection) return;
      active.current = null;
      setStatus(code === 1000 ? 'exited' : 'failed');
    };
  }

  function sendInput(data: string) {
    const connection = active.current;
    if (status === 'connected' && connection?.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify({ type: 'input', data }));
    }
  }

  function sendSize(size: TerminalSize) {
    const connection = active.current;
    if (connection?.started && connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify({ type: 'resize', ...size }));
    }
  }

  return { status, start, connect, sendInput, sendSize };
}
