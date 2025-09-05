/// <reference types="vitest" />
import { createIntConfig } from '../../tools/vitest-config-factory.js';

export default createIntConfig('utils', {
  projectRoot: new URL('../../', import.meta.url),
  setupFiles: ['testing/test-setup/src/lib/cliui.mock.ts'],
  coverage: { exclude: ['perf/**'] },
});
