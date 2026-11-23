import { execFileSync } from 'node:child_process';
import { copyFileSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
execFileSync('tsc', ['-p', 'tsconfig.build.json'], { stdio: 'inherit' });
copyFileSync('src/styles.css', 'dist/styles.css');
