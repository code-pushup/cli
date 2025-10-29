/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases.js';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/plugin-coverage',
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
      reportsDirectory: '../../coverage/plugin-jsdocs/unit-tests',
      exclude: ['mocks/**', '**/types.ts'],
    },
    environment: 'node',
    include: ['src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globalSetup: ['../../global-setup.ts'],
    setupFiles: [
      '../../testing/test-setup/src/lib/cliui.mock.ts',
      '../../testing/test-setup/src/lib/fs.mock.ts',
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
      '../../testing/test-setup/src/lib/extend/path.matcher.ts',
    ],
  },
});
