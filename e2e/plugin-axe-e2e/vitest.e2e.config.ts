/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases.js';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/plugin-axe-e2e',
  test: {
    reporters: ['basic'],
    testTimeout: 80_000,
    globals: true,
    alias: tsconfigPathAliases(),
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    cache: {
      dir: '../../node_modules/.vitest',
    },
    environment: 'node',
    include: ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['../../testing/test-setup/src/lib/reset.mocks.ts'],
  },
});
