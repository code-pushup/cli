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
      setupFiles: [
        '../../testing/test-setup/src/lib/fs.mock.ts',
        '../../testing/test-setup/src/lib/console.mock.ts',
        '../../testing/test-setup/src/lib/reset.mocks.ts',
      ],
      coverage: {
        ...baseConfig.test.coverage,
        exclude: [...baseConfig.test.coverage.exclude, 'zod2md.config.ts'],
      },
    },
  };
});
