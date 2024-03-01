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
    threads: false,
    coverage: {
      reporter: ['lcov'],
    },
    environment: 'node',
    include: ['src/**/*.unit.test.ts'],
  },
});
