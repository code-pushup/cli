/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { createSharedE2eVitestConfig } from '../../testing/test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedE2eVitestConfig({
    projectRoot: __dirname,
    workspaceRoot: '../..',
  });

  return {
    ...baseConfig,
  };
});
