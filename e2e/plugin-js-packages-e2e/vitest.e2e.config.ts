import { createE2ETestConfig } from '../../testing/test-setup-config/src/index.js';

export default createE2ETestConfig('plugin-js-packages-e2e', {
  testTimeout: 120_000,
});
