<p align="center">
  <img src="apps/playground/src/assets/virgo-terminal-logo.svg" alt="Virgo Terminal logo" width="96" height="96" />
</p>

<h1 align="center">Virgo Terminal</h1>

<p align="center">
  <a href="https://github.com/virgo-galaxy/virgo-terminal/actions/workflows/ci.yml"><img src="https://github.com/virgo-galaxy/virgo-terminal/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI status" /></a>
  <a href="https://www.npmjs.com/package/@virgo-terminal/react"><img src="https://img.shields.io/npm/v/@virgo-terminal/react?logo=npm&amp;label=npm" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" /></a>
  <a href=".node-version"><img src="https://img.shields.io/badge/node.js-24.x-339933?logo=nodedotjs&amp;logoColor=white" alt="Node.js 24.x" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/pnpm-11.9.0-F69220?logo=pnpm&amp;logoColor=white" alt="pnpm 11.9.0" /></a>
</p>

<p align="center">
  English | <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="https://terminal.virgogalaxy.com/">Try the Playground</a>
</p>

Virgo Terminal is a React component for interactive terminals and streaming logs. It displays ANSI output and lets your application connect terminal input and output to a shell over its own transport. The component is built on [xterm.js](https://xtermjs.org/).

## Use the React component

Install `@virgo-terminal/react` in an app using React 18.2 or later in the 18.x series, or React 19.

```sh
npm install @virgo-terminal/react
```

This example echoes keyboard input back to the terminal. Give the terminal host a defined height so `autoFit` can size the viewport.

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
      onData={(data) => terminal.current?.write(data.replace(/\r\n|\r|\n/g, '\r\n'))}
    />
  );
}
```

```css
.terminal-example {
  height: 20rem;
}
```

### Common integrations

| Task | API |
| --- | --- |
| Stream read-only logs | Set `readOnly` and call `write()` as lines arrive. Set `scrollback` to cap the retained history. |
| Connect a shell | Send keyboard input from `onData` and terminal dimensions from `onResize` to your transport. Pass the shell's output to `write()`. |
| Customize appearance and input | Use `appearance` for font and colors, `scrollbar` for the scrollbar, and `copyOnSelect` or `shouldHandleKeyEvent` for input behavior. |

## Playground

**Terminal** and **Simulated logs** pair live demos with integration guides in English and Simplified Chinese.

| Example | What you can try |
| --- | --- |
| Terminal | Type into an interactive terminal and see the input echoed back. |
| Simulated logs | Watch timestamped, ANSI-colored logs stream into a read-only terminal. |
| Connect device | Use the hosted Playground with a shell on your own Mac or Windows computer. Download the desktop client, choose a shell, and click **Connect** in the client. [Open Connect device](https://terminal.virgogalaxy.com/?view=connect-device) |
| Local Shell | When running the Playground locally, open a shell through the Vite dev server. The settings drawer lists the default shell and supported alternatives installed on the machine. |

## Development

From the repository root, use Node.js 24 and pnpm 11.9.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://127.0.0.1:3000/). Run `pnpm check` for type-checking, lint, tests, and builds.

| Directory | Contents |
| --- | --- |
| [packages/react](packages/react) | React component, public TypeScript API, stylesheet, and tests. |
| [apps/playground](apps/playground) | Vite Playground, bilingual guides, and the development shell adapter. |
| [apps/local-client](apps/local-client) | Go desktop client for Connect device on macOS and Windows. |

## Contributing

See the [contribution guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
