/// <reference types="vitest" />
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

export default defineConfig({
  root: fileURLToPath(dirname(import.meta.url)),
  cacheDir: 'node_modules/.vite/coverage-e2e-env',

  test: {
    reporters: ['basic'],
    globals: true,
    cache: {
      dir: 'node_modules/.vitest',
    },
    coverage: {
      reporter: ['lcov', 'text'],
      provider: 'v8',
      reportsDirectory: 'coverage',
      include: ['src/**/*.{js,mjs}'],
    },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs}']
  },
});
