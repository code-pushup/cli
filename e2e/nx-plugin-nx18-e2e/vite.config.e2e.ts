/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/nx-plugin-nx18-e2e',
  test: {
    reporters: ['basic'],
    testTimeout: 160_000,
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
