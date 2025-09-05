/// <reference types="vitest" />
import { createIntConfig } from '../../tools/vitest-config-factory.js';

export default createIntConfig('core', {
  projectRoot: new URL('../../', import.meta.url),
  setupFiles: ['testing/test-setup/src/lib/portal-client.mock.ts'],
});
