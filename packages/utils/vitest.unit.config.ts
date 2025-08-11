/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { tsconfigPathAliases } from '../../tools/vitest-tsconfig-path-aliases.js';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/utils',
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
      reportsDirectory: '../../coverage/utils/unit-tests',
      exclude: ['mocks/**', 'perf/**', '**/types.ts'],
    },
    environment: 'node',
    include: ['src/**/*.{unit,type}.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    typecheck: {
      include: ['**/*.type.test.ts'],
    },
    globalSetup: ['../../global-setup.ts'],
    setupFiles: [
      '../../testing/test-setup/src/lib/cliui.mock.ts',
      '../../testing/test-setup/src/lib/fs.mock.ts',
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
      '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
      '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
      '../../testing/test-setup/src/lib/extend/path.matcher.ts',
      '../../testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
    ],
  },
});
