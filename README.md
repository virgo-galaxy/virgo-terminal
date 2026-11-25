<p align="center">
  <img src="apps/playground/src/assets/virgo-terminal-logo.svg" alt="Virgo Terminal logo" width="96" height="96" />
</p>

<h1 align="center">Virgo Terminal</h1>

<p align="center">
  <a href="https://github.com/virgo-galaxy/virgo-terminal/actions/workflows/ci.yml"><img src="https://github.com/virgo-galaxy/virgo-terminal/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" /></a>
  <a href=".node-version"><img src="https://img.shields.io/badge/node.js-24.x-339933?logo=nodedotjs&amp;logoColor=white" alt="Node.js 24.x" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/pnpm-11.9.0-F69220?logo=pnpm&amp;logoColor=white" alt="pnpm 11.9.0" /></a>
</p>

<p align="center">
  English | <a href="README.zh-CN.md">简体中文</a>
</p>

Virgo Terminal is a React terminal component built on [xterm.js](https://xtermjs.org/). Use it to display ANSI output, stream read-only logs, or connect terminal input and output to a shell provided by your application.

## Run the Playground

From the repository root, use Node.js 24 and pnpm 11.9.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://127.0.0.1:3000/). **Terminal** and **Simulated logs** pair live demos with integration guides in English and Simplified Chinese.

| Example | What it demonstrates |
| --- | --- |
| Terminal | Keyboard input and echo in an interactive terminal. |
| Simulated logs | Streaming colored ANSI output in a read-only terminal. |
| Local Shell | A real shell on the machine running the Vite dev server, connected over a local WebSocket. |

Local Shell is available in local development. It starts with the system default shell, and the settings drawer lists supported alternatives found on the machine, such as Zsh, Bash, CMD, and PowerShell.

## Use the React component

`@virgo-terminal/react` is currently available as a workspace package. This example echoes keyboard input back to the terminal. Give the terminal host a defined height so `autoFit` can size the viewport.

```tsx
import { useRef } from 'react';
import { Terminal, type TerminalHandle } from '@virgo-terminal/react';
import '@virgo-terminal/react/styles.css';

export function TerminalExample() {
  const terminal = useRef<TerminalHandle>(null);

  return (
    <Terminal
      ref={terminal}
      className="terminal-example"
      autoFit
      onReady={(instance) => instance.write('Hello, Virgo Terminal!\r\n')}
      onData={(data) => terminal.current?.write(data.replace(/\r/g, '\r\n'))}
    />
  );
}
```

```css
.terminal-example {
  height: 20rem;
}
```

For logs, set `readOnly` and call `terminal.current?.write(...)` as data arrives. For a shell, send `onData` to your transport and use `onResize` to forward the terminal dimensions.

## Development

| Directory | Contents |
| --- | --- |
| [packages/react](packages/react) | React component, public TypeScript API, stylesheet, and tests. |
| [apps/playground](apps/playground) | Vite demos, preferences, and the local shell adapter. |

Run `pnpm check` to type-check, lint, run tests, and build the workspace.

## Contributing

See the [contribution guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
