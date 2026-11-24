import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { localShellPlugin } from './server/local-shell-plugin.js';

export default defineConfig({
  plugins: [localShellPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
