import { createIntTestConfig } from '../../testing/test-setup-config/src/index.js';

const baseConfig = createIntTestConfig('ci');

const config = {
  ...baseConfig,
  test: {
    ...baseConfig.test,
    setupFiles: [
      ...(baseConfig.test!.setupFiles || []),
      '../../testing/test-setup/src/lib/logger.mock.ts',
    ],
  },
};

export default config;
