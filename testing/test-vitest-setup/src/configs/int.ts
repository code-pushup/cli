/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { baseTestConfig } from './base.js';

export const intTestConfig = defineConfig({
  ...baseTestConfig,
  test: {
    ...baseTestConfig.test,
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      exclude: ['mocks/**', '**/types.ts'],
    },
    include: ['src/**/*.int.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: [
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
      '../../testing/test-setup/src/lib/portal-client.mock.ts',
      '../../testing/test-setup/src/lib/extend/path.matcher.ts',
    ],
  },
});
