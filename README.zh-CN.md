<p align="center">
  <img src="apps/playground/src/assets/virgo-terminal-logo.svg" alt="Virgo Terminal 标志" width="96" height="96" />
</p>

<h1 align="center">Virgo Terminal</h1>

<p align="center">
  <a href="https://github.com/virgo-galaxy/virgo-terminal/actions/workflows/ci.yml"><img src="https://github.com/virgo-galaxy/virgo-terminal/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI 状态" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT 许可证" /></a>
  <a href=".node-version"><img src="https://img.shields.io/badge/node.js-24.x-339933?logo=nodedotjs&amp;logoColor=white" alt="Node.js 24.x" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/pnpm-11.9.0-F69220?logo=pnpm&amp;logoColor=white" alt="pnpm 11.9.0" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> | 简体中文
</p>

Virgo Terminal 是基于 [xterm.js](https://xtermjs.org/) 的 React 终端组件。它可以显示 ANSI 输出、持续接收只读日志，也可以把终端的输入和输出接到应用提供的 Shell 上。

## 运行 Playground

在仓库根目录使用 Node.js 24 和 pnpm 11.9.0。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

打开 [localhost:3000](http://127.0.0.1:3000/)。**Terminal** 和 **Simulated logs** 都有实时演示和中英文接入指南。

| 示例 | 内容 |
| --- | --- |
| Terminal | 交互终端里的键盘输入与回显。 |
| Simulated logs | 在只读终端中持续输出带 ANSI 颜色的模拟日志。 |
| Local Shell | 通过本地 WebSocket 连接到运行 Vite 开发服务的机器上的真实 Shell。 |

Local Shell 在本地开发时可用。它默认使用系统 Shell，设置抽屉会列出在本机检测到的受支持选项，例如 Zsh、Bash、CMD 和 PowerShell。

## 使用 React 组件

`@virgo-terminal/react` 目前通过 pnpm 工作区使用。下面的示例把收到的键盘输入写回终端。请给终端容器设置高度，`autoFit` 会根据容器尺寸调整行列数。

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

显示日志时，设置 `readOnly`，收到数据后调用 `terminal.current?.write(...)`。接入 Shell 时，通过 `onData` 把输入交给连接层，再用 `onResize` 同步终端尺寸。

## 开发

| 目录 | 内容 |
| --- | --- |
| [packages/react](packages/react) | React 组件、公开的 TypeScript API、样式及测试。 |
| [apps/playground](apps/playground) | Vite 示例、终端设置和本地 Shell 适配代码。 |

运行 `pnpm check` 可执行类型检查、Lint、测试和构建。

## 参与贡献

请阅读[贡献指南](CONTRIBUTING.md)和[行为准则](CODE_OF_CONDUCT.md)。

## 许可证

[MIT](LICENSE)
