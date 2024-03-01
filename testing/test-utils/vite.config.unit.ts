/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases';

export default defineConfig({
  cacheDir: '../node_modules/.vite/test-utils',
  test: {
    reporters: ['default'],
    globals: true,
    cache: {
      dir: '../node_modules/.vitest',
    },
    alias: tsconfigPathAliases(),
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    coverage: {
      reporter: ['lcov'],
      reportsDirectory: '../../coverage/test-utils/unit-tests',
    },
    environment: 'node',
    include: ['src/**/*.unit.test.ts'],
  },
});
