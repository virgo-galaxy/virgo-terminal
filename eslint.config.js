import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist/**', '**/coverage/**', '**/node_modules/**', '.impeccable/**']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs', '**/*.config.ts', 'apps/playground/server/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
  },
]);
