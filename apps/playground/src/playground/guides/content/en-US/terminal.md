# Terminal

Add an interactive terminal to a React page. This example writes a welcome message and echoes what you type.

## Install

```bash
npm install @virgo-terminal/react
```

## Connect the terminal

1. Import `Terminal` from `@virgo-terminal/react` and load its stylesheet.
2. Give the terminal container a height so `autoFit` can size it to the available space.
3. Write the welcome message in `onReady`. Use `onData` to receive keyboard input and send it back to the terminal through `write()`.

## Example

```tsx
import { useRef } from 'react';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import '@virgo-terminal/react/styles.css';
import './terminal-example.css';

export function TerminalExample() {
  const terminal = useRef<TerminalHandle>(null);

  return (
    <Terminal
      ref={terminal}
      className="terminal-example"
      autoFit
      onReady={(instance) => instance.write('Hello, Virgo Terminal!\r\n')}
      onData={(data) => terminal.current?.write(data.replace(/\r\n|\r|\n/g, '\r\n'))}
    />
  );
}
```

Create `terminal-example.css` next to the component.

```css
.terminal-example {
  height: 20rem;
}
```

Render `<TerminalExample />`, click inside it, and type. Press Enter to start a new line.
