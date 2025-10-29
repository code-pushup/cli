/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
// eslint-disable-next-line import/no-useless-path-segments
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases.js';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/plugin-eslint',
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
      reportsDirectory: '../../coverage/plugin-eslint/unit-tests',
      exclude: ['mocks/**', '**/types.ts'],
    },
    environment: 'node',
    include: ['src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['src/index.ts'],
    globalSetup: ['../../global-setup.ts'],
    setupFiles: [
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/fs.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
    ],
  },
});
