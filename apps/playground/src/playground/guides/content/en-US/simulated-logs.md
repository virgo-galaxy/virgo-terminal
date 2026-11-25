# Simulated logs

Use a read-only terminal to display streaming logs. This example appends a timestamped log line every second and uses ANSI color for the log level.

```bash
npm install @virgo-terminal/react
```

## Connect the log stream

1. Set `readOnly` so the terminal accepts output while disabling keyboard input.
2. Call `write()` whenever a new log line arrives. End each line with `\r\n` so the next entry starts in the first column.
3. Set `scrollback` to cap the number of lines retained above the visible screen.

## Example

```tsx
import { useEffect, useRef } from 'react';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import '@virgo-terminal/react/styles.css';
import './log-terminal.css';

export function LogTerminal() {
  const terminal = useRef<TerminalHandle>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const timestamp = new Date().toISOString();
      terminal.current?.write(`${timestamp} \x1b[32mINFO\x1b[0m GET /health 200\r\n`);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Terminal ref={terminal} className="log-terminal" autoFit readOnly scrollback={1000} />
  );
}
```

Create `log-terminal.css` next to the component.

```css
.log-terminal {
  height: 20rem;
}
```

To use a real log source, call `write()` from its subscription callback and unsubscribe when the component unmounts.
