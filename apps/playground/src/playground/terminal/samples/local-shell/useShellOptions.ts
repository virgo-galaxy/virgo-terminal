import { useEffect, useState } from 'react';
import { showLocalShellDemo } from '@/playground/views';

export type ShellOption = { id: string; label: string };

export function useShellOptions(defaultShellId: string) {
  const [shellOptions, setShellOptions] = useState<ShellOption[]>(
    () => [{ id: defaultShellId, label: 'System default' }],
  );

  useEffect(() => {
    if (!showLocalShellDemo) return;

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
