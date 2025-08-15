import { defineConfig } from 'vitest/config';
import { createSharedIntegrationVitestConfig } from '../../testing/test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedIntegrationVitestConfig({
    projectRoot: __dirname,
    workspaceRoot: '../..',
    setupFiles: [
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
    ],
  });

  return {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      coverage: {
        ...baseConfig.test.coverage,
        exclude: [
          ...baseConfig.test.coverage.exclude,
          // CLI-specific excludes (already has mocks/** and **/types.ts)
        ],
      },
    },
  };
});
