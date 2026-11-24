import type { ITerminalOptions, Terminal as Xterm } from '@xterm/xterm';

export type TerminalAppearance = Pick<ITerminalOptions, 'fontFamily' | 'fontSize' | 'theme' | 'cursorBlink'>;

export interface TerminalSize {
  cols: number;
  rows: number;
}

export interface TerminalScrollbar {
  /** Painted width in CSS pixels. The native drag area keeps its full width. */
  thumbWidth?: number;
  /** Corner radius in CSS pixels. */
  thumbRadius?: number;
  /** Defaults to xterm's automatic visibility. Hiding the bar preserves wheel scrolling. */
  visibility?: 'auto' | 'hidden';
}

export interface TerminalHandle {
  write: Xterm['write'];
  getSize(): TerminalSize | null;
  focus(): void;
  /** Scroll to the first retained line. */
  scrollToTop(): void;
}

export interface TerminalProps {
  appearance?: TerminalAppearance;
  /** Fit the terminal to a container with a defined width and height. */
  autoFit?: boolean;
  className?: string;
  /** Copy the selected text on left mouse release. Defaults to false. */
  copyOnSelect?: boolean;
  onData?: (data: string) => void;
  onReady?: (terminal: Xterm) => void;
  onResize?: (size: TerminalSize) => void;
  readOnly?: boolean;
  scrollbar?: TerminalScrollbar;
  /** Number of rows retained above the screen. Use a non-negative integer. Defaults to xterm's limit. */
  scrollback?: number;
  /** Return false to skip xterm.js handling of this keyboard event. */
  shouldHandleKeyEvent?: (event: KeyboardEvent) => boolean;
}
