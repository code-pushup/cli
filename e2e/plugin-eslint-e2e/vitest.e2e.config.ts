/// <reference types="vitest" />
import { createE2ETestConfig } from '../../testing/test-setup-config/src/index.js';

export default createE2ETestConfig('plugin-eslint-e2e', {
  testTimeout: 20_000,
});
