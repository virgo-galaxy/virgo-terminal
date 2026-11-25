export interface DeviceTicket {
  port: number;
  key: string;
}

const launchPrefix = '#connect-device=';
const storageKey = 'virgo-terminal.device.v1';

function parseTicket(value: string): DeviceTicket | null {
  const match = /^(\d{1,5})\.([a-f0-9]{64})$/.exec(value);
  if (!match) return null;
  const [, port, key] = match;
  const portNumber = Number(port);
  return portNumber > 0 && portNumber <= 65535 && key ? { port: portNumber, key } : null;
}

export function readDeviceTicket(): DeviceTicket | null {
  const hash = window.location.hash;
  if (hash.startsWith(launchPrefix)) return parseTicket(hash.slice(launchPrefix.length));
  try {
    return parseTicket(window.sessionStorage.getItem(storageKey) ?? '');
  } catch {
    return null;
  }
}

export function clearLaunchTicket() {
  if (window.location.hash.startsWith(launchPrefix)) {
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  }
}

export function saveDeviceTicket({ port, key }: DeviceTicket) {
  try {
    window.sessionStorage.setItem(storageKey, `${port}.${key}`);
  } catch {
    // The open page can still reconnect with its in-memory credential.
  }
}

export function clearSavedDeviceTicket() {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // The current page can still forget its in-memory credential.
  }
}
