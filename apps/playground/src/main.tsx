import { StrictMode, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import '@virgo-terminal/react/styles.css';

function Playground() {
  const terminal = useRef<TerminalHandle>(null);

  return (
    <main>
      <Terminal
        ref={terminal}
        onReady={(xterm) => {
          xterm.options.cursorBlink = true;
          xterm.writeln('Hello Terminal');
          xterm.focus();
        }}
        onData={(data) => {
          if (data === '\r') {
            terminal.current?.write('\r\n');
          } else if (data === '\x7f' || data === '\b') {
            terminal.current?.write('\b \b');
          } else {
            terminal.current?.write(data);
          }
        }}
      />
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Playground root element is missing.');

createRoot(root).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
