/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { createSharedIntegrationVitestConfig } from '../../testing/test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedIntegrationVitestConfig({
    projectRoot: __dirname,
    workspaceRoot: '../..',
  });

  return {
    ...baseConfig,
  };
});
