import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { TerminalHandle, TerminalSize } from '@virgo-terminal/react';
import { clearSavedDeviceTicket, saveDeviceTicket, type DeviceTicket } from './deviceTicket';

const devicePort = 43127; // Keep in sync with the desktop client's connection port.
const approvalDenied = 4001;
const retryIntervalMs = 2500;

type Status = 'idle' | 'waiting' | 'connecting' | 'authorizing' | 'connected' | 'exited' | 'failed' | 'denied';
type BrowserAccess = PermissionState | 'checking' | 'manual';

type Connection = {
  socket: WebSocket;
  automatic: boolean;
  phase: 'opening' | 'authorizing' | 'approved' | 'started';
};

function useLoopbackAccess(enabled: boolean) {
  const alreadyLocal = window.location.hostname === '127.0.0.1';
  const [access, setAccess] = useState<BrowserAccess>('checking');

  useEffect(() => {
    if (!enabled || alreadyLocal) return;
    let disposed = false;
    let permission: PermissionStatus | undefined;
    const update = () => setAccess(permission?.state ?? 'manual');

    void (async () => {
      try {
        permission = await navigator.permissions?.query({ name: 'loopback-network' as PermissionName });
      } catch {
        // Browsers without this permission descriptor use the tab's click to connect.
      }
      if (disposed) return;
      update();
      permission?.addEventListener('change', update);
    })();

    return () => {
      disposed = true;
      permission?.removeEventListener('change', update);
    };
  }, [alreadyLocal, enabled]);

  return alreadyLocal ? 'granted' : access;
}

export function useDeviceConnection(
  ticket: DeviceTicket | null,
  terminal: RefObject<TerminalHandle | null>,
  canConnect: boolean,
  visible: boolean,
) {
  const [status, setStatus] = useState<Status>('idle');
  const active = useRef<Connection | null>(null);
  const sessionKey = useRef(ticket?.key);
  const access = useLoopbackAccess(canConnect);

  useEffect(() => () => {
    const connection = active.current;
    active.current = null;
    connection?.socket.close();
  }, []);

  const start = useCallback(() => {
    const connection = active.current;
    const size = terminal.current?.getSize();
    if (connection?.phase !== 'approved' || connection.socket.readyState !== WebSocket.OPEN || !size) return;

    connection.socket.send(JSON.stringify({ type: 'start', key: sessionKey.current, ...size }));
    connection.phase = 'started';
  }, [terminal]);

  const connect = useCallback((automatic = false) => {
    if (!canConnect || active.current) return;

    const launchPort = sessionKey.current ? ticket?.port : undefined;
    let socket: WebSocket;
    try {
      socket = new WebSocket(`ws://127.0.0.1:${launchPort ?? devicePort}/local-shell`, 'virgo-terminal.v1');
    } catch {
      setStatus('failed');
      return;
    }

    const connection: Connection = { socket, automatic, phase: 'opening' };
    socket.binaryType = 'arraybuffer';
    active.current = connection;
    if (!automatic) setStatus('connecting');

    socket.onopen = () => {
      if (active.current !== connection) return;
      if (automatic && document.visibilityState !== 'visible') {
        active.current = null;
        socket.close();
        return;
      }
      terminal.current?.write('\x1bc');
      setStatus('connecting');
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
      if (code === 1000 && connection.phase !== 'opening') {
        setStatus('exited');
      } else {
        if (launchPort) {
          sessionKey.current = undefined;
          clearSavedDeviceTicket();
        }
        if (connection.phase === 'opening') setStatus('waiting');
        else setStatus(code === approvalDenied ? 'denied' : 'failed');
      }
    };
  }, [canConnect, start, terminal, ticket]);

  const canWaitForClient = status === 'idle' || status === 'waiting';
  useEffect(() => {
    if (!visible || !canConnect || access !== 'granted' || !canWaitForClient) return;

    const tryConnect = () => {
      if (document.visibilityState === 'visible') connect(true);
    };
    const initial = window.setTimeout(tryConnect, 0);
    const retry = window.setInterval(tryConnect, retryIntervalMs);
    document.addEventListener('visibilitychange', tryConnect);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(retry);
      document.removeEventListener('visibilitychange', tryConnect);
      const connection = active.current;
      if (connection?.automatic && connection.phase === 'opening') {
        active.current = null;
        connection.socket.close();
      }
    };
  }, [access, canConnect, canWaitForClient, connect, visible]);

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

  return { status, access, start, connect, sendInput, sendSize };
}
