import { useEffect, useState } from 'react';

export type ShellOption = { id: string; label: string };

export function useShellOptions(defaultShellId: string) {
  const [shellOptions, setShellOptions] = useState<ShellOption[]>(
    () => [{ id: defaultShellId, label: 'System default' }],
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const request = new AbortController();
    void fetch('/local-shell/options', { signal: request.signal }).then(async (response) => {
      if (response.ok) {
        const options: ShellOption[] = await response.json();
        setShellOptions(options);
      }
    }).catch(() => {});
    return () => request.abort();
  }, []);

  return shellOptions;
}
