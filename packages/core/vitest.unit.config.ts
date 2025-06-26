/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases.js';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/core',
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
      reportsDirectory: '../../coverage/core/unit-tests',
      exclude: ['mocks/**', '**/types.ts'],
    },
    environment: 'node',
    include: ['src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globalSetup: ['../../global-setup.ts'],
    setupFiles: [
      '../../testing/test-setup/src/lib/cliui.mock.ts',
      '../../testing/test-setup/src/lib/fs.mock.ts',
      '../../testing/test-setup/src/lib/git.mock.ts',
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
      '../../testing/test-setup/src/lib/portal-client.mock.ts',
      '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
      '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
    ],
  },
});
