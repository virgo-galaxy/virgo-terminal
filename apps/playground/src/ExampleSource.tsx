import { useState } from 'react';
import { SegmentedControl } from '@virgo-design/ui';
import interactiveTerminalSource from './InteractiveTerminal.tsx?raw';
import simulatedLogsSource from './SimulatedLogs.tsx?raw';
import localShellSource from './LocalShell.tsx?raw';
import localShellServerSource from '../vite.config.ts?raw';

export type ExampleView = 'terminal' | 'logs' | 'shell';

const exampleFiles = {
  terminal: { name: 'InteractiveTerminal.tsx', source: interactiveTerminalSource },
  logs: { name: 'SimulatedLogs.tsx', source: simulatedLogsSource },
};

const shellFiles = {
  client: { name: 'LocalShell.tsx', source: localShellSource },
  server: { name: 'vite.config.ts', source: localShellServerSource },
};

export function ExampleSource({ view }: { view: ExampleView }) {
  const [shellFile, setShellFile] = useState<keyof typeof shellFiles>('client');
  const file = view === 'shell'
    ? (import.meta.env.DEV ? shellFiles[shellFile] : undefined)
    : exampleFiles[view];
  if (!file) return null;

  return (
    <div className="example-source">
      <div className="example-source-toolbar">
        <span>{file.name}</span>
        {import.meta.env.DEV && view === 'shell' && (
          <SegmentedControl
            aria-label="Local Shell source file"
            size="small"
            variant="soft"
            motion="slide"
            value={shellFile}
            onValueChange={(value) => setShellFile(value === 'server' ? 'server' : 'client')}
          >
            <SegmentedControl.Item value="client">Client</SegmentedControl.Item>
            <SegmentedControl.Item value="server">PTY server</SegmentedControl.Item>
          </SegmentedControl>
        )}
      </div>
      <pre key={file.name} tabIndex={0} aria-label={`${file.name} source code`}>
        <code>{file.source}</code>
      </pre>
    </div>
  );
}
