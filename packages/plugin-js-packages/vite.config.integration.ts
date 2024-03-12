/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/plugin-js-packages',
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
      reportsDirectory: '../../coverage/plugin-js-packages/integration-tests',
    },
    environment: 'node',
    include: ['src/**/*.integration.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globalSetup: ['../../global-setup.ts'],
    setupFiles: [
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
    ],
  },
});
