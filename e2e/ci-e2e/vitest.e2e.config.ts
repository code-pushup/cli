import { createE2ETestConfig } from '../../testing/test-setup-config/src/index.js';

export default createE2ETestConfig('ci-e2e', {
  testTimeout: 60_000,
});
