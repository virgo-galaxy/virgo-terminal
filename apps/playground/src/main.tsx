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
          xterm.writeln('Hello Terminal');
          xterm.focus();
        }}
        onData={(data) => terminal.current?.write(data === '\r' ? '\r\n' : data)}
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
