/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { createSharedUnitVitestConfig } from '../test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedUnitVitestConfig(
    {
      projectRoot: __dirname,
      workspaceRoot: '../..',
    },
    true,
  ); // noFsCwd = true for test-utils

  return {
    ...baseConfig,
  };
});
