# 模拟日志

用只读终端显示流式日志。这个示例每秒追加一条带时间戳的日志，并用 ANSI 转义序列给日志级别上色。

## 安装

```bash
npm install @virgo-terminal/react
```

## 接入日志流

1. 开启 `readOnly`，让终端继续显示输出，同时禁用键盘输入。
2. 每收到一条日志就调用 `write()`。在每条日志末尾加上 `\r\n`，让下一条从新一行的第一列开始。
3. 用 `scrollback` 限制可视区域上方保留的历史行数。

## 示例

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

在组件旁创建 `log-terminal.css`。

```css
.log-terminal {
  height: 20rem;
}
```

接入真实日志源时，在订阅回调里调用 `write()`，并在组件卸载时取消订阅。
