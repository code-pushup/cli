import { defineConfig } from 'vitest/config';
import { createSharedUnitVitestConfig } from '../../testing/test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedUnitVitestConfig({
    projectRoot: __dirname,
    workspaceRoot: '../..',
  });

  return {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      coverage: {
        ...baseConfig.test.coverage,
        exclude: [
          ...baseConfig.test.coverage.exclude,
          // Core-specific excludes (already has mocks/** and **/types.ts)
        ],
      },
    },
  };
});
