import type { TerminalAppearance, TerminalScrollbar } from '@virgo-terminal/react';

export type DemoTerminalProps = {
  appearance: TerminalAppearance;
  copyOnSelect: boolean;
  scrollbar: TerminalScrollbar;
  scrollback: number;
};

export type ExampleView = 'terminal' | 'logs' | 'shell';
