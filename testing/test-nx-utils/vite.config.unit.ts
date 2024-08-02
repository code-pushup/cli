/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases';

export default defineConfig({
  cacheDir: '../node_modules/.vite/test-nx-utils',
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
      reportsDirectory: '../../coverage/test-nx-utils/unit-tests',
      exclude: ['**/*.mock.{mjs,ts}', '**/*.config.{js,mjs,ts}'],
    },
    environment: 'node',
    include: ['src/**/*.unit.test.ts'],
  },
});
