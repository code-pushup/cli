/// <reference types="vitest" />
import type { UserConfig } from 'vite';
import { createE2ETestConfig } from '../../testing/test-setup-config/src/index.js';

const baseConfig = createE2ETestConfig('ci-e2e', {
  testTimeout: 60_000,
  disableCoverage: true,
});

export default {
  ...baseConfig,
  test: {
    ...(baseConfig as any).test,
    globalSetup: ['./global-setup.ts'],
  },
} as UserConfig;
