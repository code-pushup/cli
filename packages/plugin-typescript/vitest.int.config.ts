import { defineConfig } from 'vitest/config';
import { createSharedIntegrationVitestConfig } from '../../testing/test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedIntegrationVitestConfig({
    projectRoot: __dirname,
    workspaceRoot: '../..',
  });

  return {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      setupFiles: [
        '../../testing/test-setup/src/lib/cliui.mock.ts',
        '../../testing/test-setup/src/lib/reset.mocks.ts',
        '../../testing/test-setup/src/lib/chrome-path.mock.ts',
      ],
    },
  };
});
