import { createE2ETestConfig } from '../../testing/test-setup-config/src/index.js';

export default createE2ETestConfig('plugin-coverage-e2e', {
  testTimeout: 40_000,
});
