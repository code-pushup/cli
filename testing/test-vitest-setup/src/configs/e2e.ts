/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite';
import { baseTestConfig } from './base.js';

const E2E_TEST_TIMEOUT_MS = 60_000;

export const e2eTestConfig = mergeConfig(
  baseTestConfig,
  defineConfig({
    test: {
      testTimeout: E2E_TEST_TIMEOUT_MS,
      include: ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      setupFiles: ['../../testing/test-setup/src/lib/reset.mocks.ts'],
      // E2E tests typically don't need coverage as they test the full application
      coverage: {
        enabled: false,
      },
    },
  }),
);
