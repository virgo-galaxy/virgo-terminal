# 本地 Shell

在 Playground 中运行本机 Shell 命令。终端从项目目录启动，使用启动开发服务的系统账号执行命令。

## 打开 Playground

在仓库根目录运行以下命令。

```sh
pnpm install
pnpm dev
```

打开 Vite 打印的地址，选择 **本地 Shell**。可以输入 `echo Virgo Terminal`，看看 Shell 返回的输出。

## 选择或重启 Shell

点击齿轮，在 **设置 → Shell** 中选择本机已安装的 Shell。选择会在下次启动会话时生效。

输入 `exit` 结束当前会话，再点 **启动 Shell** 即可开启新会话。

## Local Shell 是怎么实现的

1. **在浏览器里挂载终端。** Playground 渲染 `@virgo-terminal/react` 的 `Terminal`。`onReady` 触发后，浏览器通过 WebSocket 连接本地 Vite 服务的 `/local-shell`，把选中的 Shell 和初始行列数发过去。[LocalShell.tsx](https://github.com/virgo-galaxy/virgo-terminal/blob/main/apps/playground/src/playground/terminal/samples/local-shell/LocalShell.tsx)

2. **在本机启动 Shell。** Vite 插件用 `node-pty` 给 Shell 分配一个伪终端（PTY）。所以 Vim、`top` 这类程序可以像在系统终端里一样接收按键、刷新画面和响应窗口大小的变化。WebSocket 断开时，插件会结束对应的 Shell。[local-shell-plugin.ts](https://github.com/virgo-galaxy/virgo-terminal/blob/main/apps/playground/server/local-shell-plugin.ts)

3. **双向传输输入和输出。** `onData` 把键盘输入传给 PTY，`onResize` 同步新的行列数，Shell 的输出则由浏览器通过 `write()` 写进终端。[useLocalShell.ts](https://github.com/virgo-galaxy/virgo-terminal/blob/main/apps/playground/src/playground/terminal/samples/local-shell/useLocalShell.ts)

开发服务还会检测本机装了哪些 Shell，供 **设置 → Shell** 下拉框使用。[local-shells.ts](https://github.com/virgo-galaxy/virgo-terminal/blob/main/apps/playground/server/local-shells.ts)
