import { useEffect, useRef } from 'react';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import styles from '../../terminal.module.css';
import type { DemoTerminalProps } from '../../types';
import { loginMessage, prompt } from './fixtures';

export function InteractiveTerminal({ appearance, copyOnSelect, scrollbar, scrollback }: DemoTerminalProps) {
  const terminal = useRef<TerminalHandle>(null);
  const inputLength = useRef(0);

  useEffect(() => {
    terminal.current?.focus();
  }, []);

  return (
    <Terminal
      appearance={{ ...appearance, cursorBlink: true }}
      autoFit
      className={styles.terminal!}
      copyOnSelect={copyOnSelect}
      ref={terminal}
      scrollbar={scrollbar}
      scrollback={scrollback}
      onReady={() => {
        inputLength.current = 0;
        terminal.current?.write(`${loginMessage}\r\n${prompt}`);
      }}
      onData={(data) => {
        if (data === '\x7f' || data === '\b') {
          if (inputLength.current > 0) {
            inputLength.current -= 1;
            terminal.current?.write('\b \b');
          }
          return;
        }
        if (data.startsWith('\x1b')) return;

        const text = Array.from(data.replace(/\r\n?/g, '\n'))
          .filter((char) => char === '\n' || (char >= ' ' && char !== '\x7f'))
          .join('');
        const lastNewline = text.lastIndexOf('\n');
        if (lastNewline !== -1) inputLength.current = 0;
        inputLength.current += Array.from(text.slice(lastNewline + 1)).length;
        terminal.current?.write(text.replaceAll('\n', `\r\n${prompt}`));
      }}
    />
  );
}
