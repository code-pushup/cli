/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases.js';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/nx-plugin',
  test: {
    reporters: ['basic'],
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    alias: tsconfigPathAliases(),
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: '../../coverage/nx-plugin/int-tests',
      exclude: ['mocks/**', '**/types.ts', '**/__snapshots__/**'],
    },
    environment: 'node',
    include: ['src/**/*.int.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: [
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
    ],
  },
});
