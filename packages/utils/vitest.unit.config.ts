import { defineConfig } from 'vitest/config';
import {
  TYPE_TEST_CONFIG,
  createSharedUnitVitestConfig,
} from '../../testing/test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedUnitVitestConfig({
    projectRoot: __dirname,
    workspaceRoot: '../..',
  });

  return {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      ...TYPE_TEST_CONFIG,
      setupFiles: [
        ...baseConfig.test.setupFiles,
        '../../testing/test-setup/src/lib/extend/path.matcher.ts',
      ],
      coverage: {
        ...baseConfig.test.coverage,
        exclude: [...baseConfig.test.coverage.exclude, 'perf/**'],
      },
    },
  };
});
