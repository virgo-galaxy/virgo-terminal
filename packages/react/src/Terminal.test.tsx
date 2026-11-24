// @vitest-environment jsdom

import type { IBufferRange, ITerminalOptions, Terminal as Xterm } from '@xterm/xterm';
import { act, createRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Terminal, type TerminalHandle, type TerminalSize } from './Terminal.js';

const { TerminalMock, terminals, fit, disposeFit } = vi.hoisted(() => {
  const terminals: TerminalMock[] = [];

  class TerminalMock {
    readonly element = document.createElement('div');
    private readonly dataListeners = new Set<(data: string) => void>();
    private readonly resizeListeners = new Set<(size: TerminalSize) => void>();
    cols = 80;
    rows = 24;
    selection?: IBufferRange;
    selectedText = '';
    write = vi.fn<Xterm['write']>();
    focus = vi.fn();
    dispose = vi.fn(() => this.element.remove());
    loadAddon = vi.fn();
    attachCustomKeyEventHandler = vi.fn<Xterm['attachCustomKeyEventHandler']>();

    constructor(public options: ITerminalOptions) {
      terminals.push(this);
    }

    open(container: HTMLElement) {
      this.element.addEventListener('mousedown', (event) => {
        if (event.button === 0) delete this.selection;
      });
      container.append(this.element);
    }

    onData(listener: (data: string) => void) {
      this.dataListeners.add(listener);
      return { dispose: () => this.dataListeners.delete(listener) };
    }

    onResize(listener: (size: TerminalSize) => void) {
      this.resizeListeners.add(listener);
      return { dispose: () => this.resizeListeners.delete(listener) };
    }

    input(data: string) {
      if (this.options.disableStdin) return;
      for (const listener of this.dataListeners) listener(data);
    }

    resize(cols: number, rows: number) {
      this.cols = cols;
      this.rows = rows;
      for (const listener of this.resizeListeners) listener({ cols, rows });
    }

    hasSelection() {
      return this.selection !== undefined;
    }

    getSelectionPosition() {
      return this.selection;
    }

    getSelection() {
      return this.hasSelection() ? this.selectedText : '';
    }
  }

  return { TerminalMock, terminals, fit: vi.fn(), disposeFit: vi.fn() };
});

vi.mock('@xterm/xterm', () => ({ Terminal: TerminalMock }));
vi.mock('@xterm/addon-fit', () => ({
  FitAddon: class {
    fit = fit;
    dispose = disposeFit;
  },
}));

const originalClipboard = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
let container: HTMLDivElement;
let root: Root;

function render(node: ReactNode) {
  act(() => root.render(node));
}

function getTerminal() {
  const terminal = terminals.at(-1);
  if (!terminal) throw new Error('The terminal did not mount');
  return terminal;
}

function mouse(target: EventTarget, type: 'mousedown' | 'mouseup', button = 0) {
  target.dispatchEvent(new MouseEvent(type, { button, bubbles: true }));
}

beforeEach(() => {
  terminals.length = 0;
  vi.clearAllMocks();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  if (originalClipboard) Object.defineProperty(window.navigator, 'clipboard', originalClipboard);
  else Reflect.deleteProperty(window.navigator, 'clipboard');
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Terminal', () => {
  it('opens before onReady and forwards writes and focus through the ref', () => {
    const ref = createRef<TerminalHandle>();
    const onReady = vi.fn((terminal: Xterm) => {
      expect(container.contains(terminal.element ?? null)).toBe(true);
    });
    render(<Terminal ref={ref} onReady={onReady} />);
    const terminal = getTerminal();
    const data = new Uint8Array([65]);
    const onWrite = vi.fn();

    ref.current?.write(data, onWrite);
    ref.current?.focus();

    expect(onReady).toHaveBeenCalledExactlyOnceWith(terminal);
    expect(terminal.write).toHaveBeenCalledExactlyOnceWith(data, onWrite);
    expect(terminal.focus).toHaveBeenCalledTimes(1);
    expect(ref.current?.getSize()).toEqual({ cols: 80, rows: 24 });
  });

  it('uses the latest input callback and disposes subscriptions before remounting', () => {
    const firstData = vi.fn();
    const onData = vi.fn();
    const onResize = vi.fn();
    render(<Terminal onData={firstData} onResize={onResize} />);
    const first = getTerminal();
    first.input('a');
    render(<Terminal onData={onData} onResize={onResize} />);
    first.input('b');

    render(null);
    first.input('stale');
    first.resize(100, 30);
    render(<Terminal onData={onData} onResize={onResize} />);
    const second = getTerminal();
    second.input('c');

    expect(firstData.mock.calls).toEqual([['a']]);
    expect(onData.mock.calls).toEqual([['b'], ['c']]);
    expect(onResize).not.toHaveBeenCalled();
    expect(first.dispose).toHaveBeenCalledTimes(1);
    expect(terminals).toHaveLength(2);
    expect(second).not.toBe(first);
  });

  it('fits a visible container, reports the new size, and cancels pending work on unmount', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const callbacks: (() => void)[] = [];
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class {
      observe = observe;
      disconnect = disconnect;

      constructor(callback: () => void) {
        callbacks.push(callback);
      }
    });

    const ref = createRef<TerminalHandle>();
    const onResize = vi.fn();
    render(<Terminal autoFit ref={ref} onResize={onResize} />);
    const terminal = getTerminal();
    const observed = terminal.element.parentElement;
    const notify = callbacks[0];
    if (!observed || !notify) throw new Error('The terminal container was not observed');
    expect(terminal.loadAddon).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ fit }));
    expect(observe).toHaveBeenCalledExactlyOnceWith(observed);

    notify();
    vi.advanceTimersToNextFrame();
    expect(fit).not.toHaveBeenCalled();

    Object.defineProperties(observed, { clientWidth: { value: 800 }, clientHeight: { value: 400 } });
    fit.mockImplementationOnce(() => terminal.resize(100, 30));
    notify();
    notify();
    vi.advanceTimersToNextFrame();
    expect(fit).toHaveBeenCalledTimes(1);
    expect(onResize).toHaveBeenCalledExactlyOnceWith({ cols: 100, rows: 30 });
    expect(ref.current?.getSize()).toEqual({ cols: 100, rows: 30 });

    notify();
    render(null);
    vi.advanceTimersToNextFrame();
    expect(fit).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(disposeFit).toHaveBeenCalledTimes(1);
  });

  it('allows output in read-only mode and restores input when readOnly is removed', () => {
    const ref = createRef<TerminalHandle>();
    const onData = vi.fn();
    render(<Terminal readOnly ref={ref} onData={onData} />);
    const terminal = getTerminal();
    expect(terminal.options.disableStdin).toBe(true);

    terminal.input('blocked');
    ref.current?.write('log output');
    expect(onData).not.toHaveBeenCalled();
    expect(terminal.write).toHaveBeenCalledWith('log output', undefined);

    render(<Terminal ref={ref} onData={onData} />);
    expect(terminal.options.disableStdin).toBe(false);
    terminal.input('allowed');
    expect(onData).toHaveBeenCalledExactlyOnceWith('allowed');
    expect(terminals).toHaveLength(1);
  });

  it('updates scrollbar presentation in place and restores native styling when omitted', () => {
    render(<Terminal />);
    const terminal = getTerminal();
    const viewport = terminal.element.parentElement;
    if (!viewport) throw new Error('The terminal did not open');

    expect(viewport.hasAttribute('data-virgo-terminal-scrollbar')).toBe(false);
    render(<Terminal scrollbar={{ thumbWidth: 6, thumbRadius: 3 }} />);
    expect(viewport.getAttribute('data-virgo-terminal-scrollbar')).toBe('auto');
    expect(viewport.style.getPropertyValue('--virgo-terminal-thumb-width')).toBe('6px');
    expect(viewport.style.getPropertyValue('--virgo-terminal-thumb-radius')).toBe('3px');

    render(<Terminal scrollbar={{ visibility: 'hidden' }} />);
    expect(viewport.getAttribute('data-virgo-terminal-scrollbar')).toBe('hidden');
    expect(viewport.style.getPropertyValue('--virgo-terminal-thumb-width')).toBe('');
    expect(viewport.style.getPropertyValue('--virgo-terminal-thumb-radius')).toBe('');

    render(<Terminal />);
    expect(viewport.hasAttribute('data-virgo-terminal-scrollbar')).toBe(false);
    expect(terminals).toHaveLength(1);
  });

  it('only copies text on a completed left selection when copyOnSelect is enabled', () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<Terminal readOnly />);
    const terminal = getTerminal();
    const selection = { start: { x: 0, y: 0 }, end: { x: 5, y: 0 } };

    function selectWithMouse() {
      mouse(terminal.element, 'mousedown');
      terminal.selection = selection;
      terminal.selectedText = 'hello';
    }

    selectWithMouse();
    mouse(document.body, 'mouseup');
    expect(writeText).not.toHaveBeenCalled();

    render(<Terminal readOnly copyOnSelect />);
    mouse(terminal.element, 'mousedown', 2);
    mouse(terminal.element, 'mouseup', 2);
    selectWithMouse();
    expect(writeText).not.toHaveBeenCalled();

    mouse(document.body, 'mouseup');
    mouse(document.body, 'mouseup');
    expect(writeText).toHaveBeenCalledExactlyOnceWith('hello');

    selectWithMouse();
    render(<Terminal readOnly />);
    mouse(document.body, 'mouseup');
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(terminals).toHaveLength(1);
  });

  it('uses the latest keyboard handler and restores xterm handling when it is removed', () => {
    render(<Terminal />);
    const terminal = getTerminal();
    const handler = terminal.attachCustomKeyEventHandler.mock.lastCall?.[0];
    if (!handler) throw new Error('The terminal key handler was not attached');
    const search = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    const interrupt = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
    expect(handler(search)).toBe(true);

    const shouldHandleKeyEvent = vi.fn((event: KeyboardEvent) => !(event.metaKey && event.key === 'k'));
    render(<Terminal shouldHandleKeyEvent={shouldHandleKeyEvent} />);
    expect(handler(search)).toBe(false);
    expect(handler(interrupt)).toBe(true);
    expect(shouldHandleKeyEvent.mock.calls).toEqual([[search], [interrupt]]);

    render(<Terminal />);
    expect(handler(search)).toBe(true);
    expect(terminals).toHaveLength(1);
  });
});
