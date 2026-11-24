import type { IBufferRange, Terminal as Xterm } from '@xterm/xterm';
import { useEffect, type RefObject } from 'react';

export function useCopyOnSelect(instance: RefObject<Xterm | null>, copyOnSelect: boolean) {
  useEffect(() => {
    const terminal = instance.current;
    const element = terminal?.element;
    if (!copyOnSelect || !terminal || !element) return;

    const ownerDocument = element.ownerDocument;
    const clipboard = ownerDocument.defaultView?.navigator.clipboard;
    if (!clipboard) return;

    let pressedInTerminal = false;
    let previousSelection: IBufferRange | undefined;

    const trackMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      pressedInTerminal = event.composedPath().includes(element);
      previousSelection = pressedInTerminal ? terminal.getSelectionPosition() : undefined;
    };

    const trackSelectionStart = (event: MouseEvent) => {
      // xterm may clear the old selection on press before the user selects the same range again.
      if (event.button === 0 && !terminal.hasSelection()) previousSelection = undefined;
    };

    const copySelection = (event: MouseEvent) => {
      if (event.button !== 0 || !pressedInTerminal) return;
      pressedInTerminal = false;

      const selection = terminal.getSelectionPosition();
      if (!selection) return;
      if (previousSelection
        && selection.start.x === previousSelection.start.x && selection.start.y === previousSelection.start.y
        && selection.end.x === previousSelection.end.x && selection.end.y === previousSelection.end.y) return;

      const text = terminal.getSelection();
      // Browser clipboard permission is independent of terminal selection.
      if (text) void clipboard.writeText(text).catch(() => {});
    };

    ownerDocument.addEventListener('mousedown', trackMouseDown, true);
    element.addEventListener('mousedown', trackSelectionStart);
    ownerDocument.addEventListener('mouseup', copySelection, true);

    return () => {
      ownerDocument.removeEventListener('mousedown', trackMouseDown, true);
      element.removeEventListener('mousedown', trackSelectionStart);
      ownerDocument.removeEventListener('mouseup', copySelection, true);
    };
  }, [copyOnSelect, instance]);
}
