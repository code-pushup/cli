/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases.js';

export default defineConfig({
  cacheDir: '../node_modules/.vite/test-setup',
  test: {
    reporters: ['basic'],
    globals: true,
    cache: {
      dir: '../node_modules/.vitest',
    },
    alias: tsconfigPathAliases(),
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: '../../coverage/test-setup/unit-tests',
      exclude: ['**/*.mock.{mjs,ts}', '**/*.config.{js,mjs,ts}'],
    },
    environment: 'node',
    include: ['src/**/*.unit.test.ts'],
    setupFiles: [
      '../test-setup/src/lib/reset.mocks.ts',
      '../test-setup/src/lib/extend/path.matcher.ts',
      '../test-setup/src/lib/extend/markdown-table.matcher.ts',
    ],
  },
});
