/// <reference types="vitest" />
import { createIntTestConfig } from '../../testing/test-setup-config/src/index.js';

let config = createIntTestConfig('ci');

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
