import { chmod, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import type { IPty } from 'node-pty';
import { defineConfig } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';

export default defineConfig({
  plugins: [{
    name: 'local-shell',
    async configureServer(server) {
      const http = server.httpServer;
      if (!http) return;

      if (process.platform === 'darwin') {
        // The node-pty 1.1.0 tarball omits the execute bit on its macOS helper.
        const packagePath = createRequire(import.meta.url).resolve('node-pty/package.json');
        const helper = resolve(dirname(packagePath), 'prebuilds', `darwin-${process.arch}`, 'spawn-helper');
        const info = await stat(helper).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
        });
        if (info && !(info.mode & 0o100)) await chmod(helper, info.mode | 0o111);
      }

      const { spawn } = await import('node-pty');
      const sockets = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 });
      const cwd = resolve(server.config.root, '../..');
      const windows = process.platform === 'win32';
      const shell = windows ? process.env.ComSpec || 'cmd.exe' : process.env.SHELL || '/bin/sh';
      const shellArgs = windows ? [] : ['-l'];

      sockets.on('connection', (socket) => {
        let terminal: IPty | undefined;

        socket.on('error', () => socket.terminate());
        socket.once('close', () => terminal?.kill());
        socket.on('message', (data, binary) => {
          if (binary) return;

          let message: unknown;
          try {
            message = JSON.parse(data.toString());
          } catch {
            return;
          }
          if (!message || typeof message !== 'object' || !('type' in message)) return;

          try {
            if (message.type === 'input' && 'data' in message && typeof message.data === 'string') {
              terminal?.write(message.data);
            } else if (message.type === 'resize' && 'cols' in message && 'rows' in message) {
              const { cols, rows } = message;
              if (typeof cols !== 'number' || typeof rows !== 'number' ||
                !Number.isInteger(cols) || !Number.isInteger(rows) ||
                cols < 2 || cols > 1000 || rows < 1 || rows > 1000) return;

              if (terminal) {
                terminal.resize(cols, rows);
                return;
              }

              terminal = spawn(shell, shellArgs, {
                name: 'xterm-256color', cols, rows, cwd, env: process.env,
              });
              terminal.onData((output) => {
                if (socket.readyState === WebSocket.OPEN) socket.send(output);
              });
              terminal.onExit(() => {
                terminal = undefined;
                socket.close(1000);
              });
            }
          } catch (error) {
            server.config.logger.error(String(error));
            socket.close(1011, 'Local shell failed');
          }
        });
      });

      http.on('upgrade', (request, connection, head) => {
        if (request.url !== '/local-shell') return;

        const { remoteAddress, localPort } = request.socket;
        const { host, origin } = request.headers;
        const local = remoteAddress === '127.0.0.1' || remoteAddress === '::1' || remoteAddress === '::ffff:127.0.0.1';
        const localHost = host === `127.0.0.1:${localPort}` || host === `localhost:${localPort}`;
        if (!local || !localHost || origin !== `http://${host}`) {
          connection.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
          return;
        }

        sockets.handleUpgrade(request, connection, head, (socket) => sockets.emit('connection', socket));
      });

      http.once('close', () => {
        for (const socket of sockets.clients) socket.terminate();
        sockets.close();
      });
    },
  }],
});
