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
        '../../testing/test-setup/src/lib/cliui.mock.ts',
        '../../testing/test-setup/src/lib/fs.mock.ts',
        '../../testing/test-setup/src/lib/console.mock.ts',
        '../../testing/test-setup/src/lib/reset.mocks.ts',
        '../../testing/test-setup/src/lib/extend/path.matcher.ts',
        '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
      ],
      coverage: baseConfig.test.coverage,
    },
  };
});
