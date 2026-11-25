# 终端

在 React 页面中接入交互式终端。这个示例会显示一条欢迎语，并回显你输入的内容。

```bash
npm install @virgo-terminal/react
```

## 接入终端

1. 从 `@virgo-terminal/react` 导入 `Terminal`，并引入它的样式表。
2. 给终端容器设置高度，`autoFit` 会让终端适应可用空间。
3. 在 `onReady` 中写入欢迎语。在 `onData` 中接收键盘输入，再用 `write()` 将它写回终端。

## 示例

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

在组件旁创建 `terminal-example.css`。

```css
.terminal-example {
  height: 20rem;
}
```

渲染 `<TerminalExample />` 后，点击终端区域就可以输入，按回车换行。
