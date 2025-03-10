/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases.js';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/plugin-typescript-e2e',
  test: {
    reporters: ['basic'],
    testTimeout: 120_000,
    globals: true,
    alias: tsconfigPathAliases(),
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: '../../coverage/plugin-typescript-e2e/e2e-tests',
      exclude: ['mocks/**', '**/types.ts'],
    },
    cache: {
      dir: '../../node_modules/.vitest',
    },
    environment: 'node',
    include: ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['../../testing/test-setup/src/lib/reset.mocks.ts'],
  },
});
