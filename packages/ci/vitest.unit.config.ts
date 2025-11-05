import { createUnitTestConfig } from '../../testing/test-setup-config/src/index.js';

let config = createUnitTestConfig('ci');

config = {
  ...config,
  test: {
    ...config.test,
    setupFiles: [
      ...(config.test!.setupFiles || []),
      '../../testing/test-setup/src/lib/logger.mock.ts',
    ],
  },
};

export default config;
