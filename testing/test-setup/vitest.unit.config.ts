/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { createSharedUnitVitestConfig } from '../test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedUnitVitestConfig({
    projectRoot: __dirname,
    workspaceRoot: '../..',
  });

  return {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      setupFiles: [
        ...baseConfig.test.setupFiles,
        'src/lib/extend/path.matcher.ts',
      ],
    },
  };
});
