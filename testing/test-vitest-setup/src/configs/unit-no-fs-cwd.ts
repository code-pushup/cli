/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite';
import { baseTestConfig } from './base.js';

/**
 * Unit test configuration that mocks fs but NOT process.cwd()
 * Use this for utility packages that need to test real process.cwd() behavior
 */
export const unitTestConfigNoFsCwd = mergeConfig(
  baseTestConfig,
  defineConfig({
    test: {
      coverage: {
        reporter: ['text', 'lcov'],
        reportsDirectory: './coverage',
        exclude: ['mocks/**', '**/types.ts'],
      },
      include: ['src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      setupFiles: [
        '../../testing/test-setup/src/lib/fs-memfs.setup-file.ts', // Only fs, no cwd
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
  }),
);
