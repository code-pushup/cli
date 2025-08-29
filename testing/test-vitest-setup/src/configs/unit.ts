/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { baseTestConfig } from './base.js';

export const unitTestConfig = defineConfig({
  ...baseTestConfig,
  test: {
    ...baseTestConfig.test,
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      exclude: ['mocks/**', '**/types.ts'],
    },
    include: ['src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: [
      '../../testing/test-setup/src/lib/fs-with-cwd.setup-file.ts',
      '../../testing/test-setup/src/lib/cliui.mock.ts',
      '../../testing/test-setup/src/lib/git.mock.ts',
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
      '../../testing/test-setup/src/lib/portal-client.mock.ts',
      '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
      '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
      '../../testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
    ],
  },
});
