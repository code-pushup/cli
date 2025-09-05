/// <reference types="vitest" />
import { createUnitConfig } from '../../tools/vitest-config-factory.js';

export default createUnitConfig('core', {
  projectRoot: new URL('../../', import.meta.url),
  setupFiles: [
    'testing/test-setup/src/lib/cliui.mock.ts',
    'testing/test-setup/src/lib/fs.mock.ts',
    'testing/test-setup/src/lib/git.mock.ts',
    'testing/test-setup/src/lib/portal-client.mock.ts',
    'testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
    'testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
    'testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
  ],
});
