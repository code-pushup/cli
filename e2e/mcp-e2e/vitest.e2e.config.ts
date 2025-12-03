import { createE2ETestConfig } from '../../testing/test-setup-config/src/index.js';

export default createE2ETestConfig('mcp-e2e', {
  testTimeout: 20_000,
});
