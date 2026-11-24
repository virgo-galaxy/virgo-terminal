import { execFileSync } from 'node:child_process';
import { copyFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const tsc = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));

rmSync('dist', { recursive: true, force: true });
execFileSync(process.execPath, [tsc, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
copyFileSync('src/terminal/styles.css', 'dist/styles.css');
