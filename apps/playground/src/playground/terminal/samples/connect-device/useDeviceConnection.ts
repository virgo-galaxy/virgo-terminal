import { useEffect, useRef, useState, type RefObject } from 'react';
import type { TerminalHandle, TerminalSize } from '@virgo-terminal/react';
import { clearSavedDeviceTicket, saveDeviceTicket, type DeviceTicket } from './deviceTicket';

const devicePort = 43127; // Keep in sync with the desktop client's connection port.
const approvalDenied = 4001;

type Status = 'idle' | 'connecting' | 'authorizing' | 'connected' | 'exited' | 'failed' | 'denied';

type Connection = {
  socket: WebSocket;
  phase: 'opening' | 'authorizing' | 'approved' | 'started';
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
    if (connection?.phase !== 'approved' || connection.socket.readyState !== WebSocket.OPEN || !size) return;

    connection.socket.send(JSON.stringify({ type: 'start', key: sessionKey.current, ...size }));
    connection.phase = 'started';
  }

  function connect() {
    if (active.current) return;

    const launchPort = sessionKey.current ? ticket?.port : undefined;
    // Start the connection from the click so the browser can request local access.
    const socket = new WebSocket(`ws://127.0.0.1:${launchPort ?? devicePort}/local-shell`, 'virgo-terminal.v1');
    const connection: Connection = { socket, phase: 'opening' };
    socket.binaryType = 'arraybuffer';
    active.current = connection;
    setStatus('connecting');

    socket.onopen = () => {
      if (active.current !== connection) return;
      terminal.current?.write('\x1bc');
      if (launchPort) {
        connection.phase = 'approved';
        start();
      } else {
        connection.phase = 'authorizing';
        socket.send(JSON.stringify({ type: 'pair' }));
      }
    };
    socket.onmessage = ({ data }) => {
      if (active.current !== connection) return;
      if (data instanceof ArrayBuffer) {
        terminal.current?.write(new Uint8Array(data));
      } else if (typeof data === 'string') {
        try {
          const reply = JSON.parse(data) as { type?: unknown; key?: unknown } | null;
          if (connection.phase === 'authorizing' && reply?.type === 'awaiting-approval') {
            setStatus('authorizing');
          } else if (connection.phase === 'authorizing' && reply?.type === 'approved') {
            connection.phase = 'approved';
            setStatus('connecting');
            start();
          } else if (connection.phase === 'started' && reply?.type === 'ready') {
            if (launchPort) {
              if (typeof reply.key !== 'string' || !/^[a-f0-9]{64}$/.test(reply.key)) {
                socket.close();
                return;
              }
              sessionKey.current = reply.key;
              saveDeviceTicket({ port: launchPort, key: reply.key });
            }
            setStatus('connected');
          }
        } catch {
          socket.close();
        }
      }
    };
    socket.onclose = ({ code }) => {
      if (active.current !== connection) return;
      active.current = null;
      if (code === 1000) {
        setStatus('exited');
      } else {
        if (launchPort) {
          sessionKey.current = undefined;
          clearSavedDeviceTicket();
        }
        setStatus(code === approvalDenied ? 'denied' : 'failed');
      }
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
    if (connection?.phase === 'started' && connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify({ type: 'resize', ...size }));
    }
  }

  return { status, start, connect, sendInput, sendSize };
}
