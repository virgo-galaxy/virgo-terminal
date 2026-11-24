import { useState } from 'react';
import { ChevronDownIcon } from '@virgo-design/icons';
import { Menu } from '@virgo-design/ui';
import type { ExampleView } from '@/examples/types';
import { exampleFiles, shellFiles } from './example-sources';

export function ExampleSource({ view }: { view: ExampleView }) {
  const [shellFile, setShellFile] = useState<keyof typeof shellFiles>('client');
  const file = view === 'shell'
    ? (import.meta.env.DEV ? shellFiles[shellFile] : undefined)
    : exampleFiles[view];
  if (!file) return null;

  return (
    <div className="example-source">
      <div className="example-source-toolbar">
        {import.meta.env.DEV && view === 'shell' ? (
          <Menu size="small">
            <Menu.Trigger render={(props) => <button {...props} className="example-source-file-trigger" />}>
              {file.name}
              <ChevronDownIcon size={12} aria-hidden="true" />
            </Menu.Trigger>
            <Menu.Content>
              <Menu.RadioGroup value={shellFile} onValueChange={(value) => setShellFile(value === 'server' ? 'server' : 'client')}>
                {Object.entries(shellFiles).map(([value, sourceFile]) => (
                  <Menu.RadioItem key={value} value={value} closeOnSelect>{sourceFile.name}</Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Content>
          </Menu>
        ) : (
          <span>{file.name}</span>
        )}
      </div>
      <pre key={file.name} tabIndex={0} aria-label={`${file.name} source code`}>
        <code>{file.source}</code>
      </pre>
    </div>
  );
}
