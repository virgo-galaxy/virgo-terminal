# Local Shell

Run commands in your computer’s shell from the Playground. The terminal opens in the project directory and runs as the user who started the development server.

## Open the Playground

Run these commands from the repository root.

```sh
pnpm install
pnpm dev
```

Open the address printed by Vite and select **Local Shell**. Try `echo Virgo Terminal` to see the shell return output.

## Choose or restart a shell

In the gear menu, open **Settings → Shell** and choose from the shells installed on your computer. The selection takes effect the next time you start a session.

Run `exit` to end the current session, then click **Start shell** to open another one.

## How Local Shell works

1. **Mount the terminal in the browser.** The Playground renders `Terminal` from `@virgo-terminal/react`. When `onReady` fires, it connects to `/local-shell` on the local Vite server and sends the selected shell and the terminal size. [LocalShell.tsx](https://github.com/virgo-galaxy/virgo-terminal/blob/main/apps/playground/src/playground/terminal/samples/local-shell/LocalShell.tsx)

2. **Start a shell on your computer.** The Vite plugin uses `node-pty` to launch the shell in a pseudo-terminal (PTY). This gives programs such as Vim and `top` a terminal they can read from, draw to, and resize with. The plugin ends the shell when the WebSocket closes. [local-shell-plugin.ts](https://github.com/virgo-galaxy/virgo-terminal/blob/main/apps/playground/server/local-shell-plugin.ts)

3. **Send input and output over the WebSocket.** `onData` forwards keyboard input to the PTY, `onResize` sends new rows and columns, and `write()` displays the shell’s output in the browser. [useLocalShell.ts](https://github.com/virgo-galaxy/virgo-terminal/blob/main/apps/playground/src/playground/terminal/samples/local-shell/useLocalShell.ts)

The development server also detects which shells are installed and returns the choices shown in **Settings → Shell**. [local-shells.ts](https://github.com/virgo-galaxy/virgo-terminal/blob/main/apps/playground/server/local-shells.ts)
