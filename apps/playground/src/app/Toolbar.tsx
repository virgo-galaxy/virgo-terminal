import type { ReactNode } from 'react';
import { CodeIcon, GithubIcon, MonitorIcon } from '@virgo-design/icons';
import { Button, SegmentedControl } from '@virgo-design/ui';
import terminalLogo from '@/assets/virgo-terminal-logo.svg';
import type { ExampleView, Presentation } from '@/examples/types';

export function Toolbar({ view, presentation, onSelectExample, children }: {
  view: ExampleView;
  presentation: Presentation;
  onSelectExample: (view: ExampleView, presentation: Presentation) => void;
  children: ReactNode;
}) {
  return (
    <header className="toolbar">
      <img src={terminalLogo} alt="Virgo Terminal" width={24} height={24} />
      <SegmentedControl
        aria-label="Playground view"
        size="small"
        variant="soft"
        motion="slide"
        value={view}
        onValueChange={(value) => onSelectExample(value as ExampleView, presentation)}
      >
        <SegmentedControl.Item value="terminal">Terminal</SegmentedControl.Item>
        <SegmentedControl.Item value="logs">Simulated logs</SegmentedControl.Item>
        {import.meta.env.DEV && (
          <SegmentedControl.Item value="shell">Local Shell</SegmentedControl.Item>
        )}
      </SegmentedControl>
      <div className="toolbar-actions">
        <SegmentedControl
          aria-label="Example presentation"
          size="small"
          variant="soft"
          motion="slide"
          value={presentation}
          onValueChange={(value) => onSelectExample(view, value === 'code' ? 'code' : 'preview')}
        >
          <SegmentedControl.Item value="preview" icon={<MonitorIcon />}>Preview</SegmentedControl.Item>
          <SegmentedControl.Item value="code" icon={<CodeIcon />}>Code</SegmentedControl.Item>
        </SegmentedControl>
        <Button
          type="button"
          size="small"
          variant="outline"
          iconOnly
          aria-label="GitHub repository"
          title="GitHub"
          onClick={() => window.open('https://github.com/virgo-galaxy/virgo-terminal', '_blank', 'noopener,noreferrer')}
        >
          <GithubIcon aria-hidden="true" />
        </Button>
        {children}
      </div>
    </header>
  );
}
