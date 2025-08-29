/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { createSharedE2eVitestConfig } from '../utils/project-config.js';

export const e2eTestConfig = defineConfig(() => {
  const baseConfig = createSharedE2eVitestConfig({
    projectRoot: process.cwd(),
    workspaceRoot: '../..',
  });

  return {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      include: ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      setupFiles: ['../../testing/test-setup/src/lib/reset.mocks.ts'],
      coverage: {
        enabled: false,
      },
    },
  };
});
