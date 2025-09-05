/// <reference types="vitest" />
import { createUnitConfig } from '../../tools/vitest-config-factory.js';

export default createUnitConfig('utils', {
  projectRoot: new URL('../../', import.meta.url),
  include: ['src/**/*.{unit,type}.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  typecheckInclude: ['**/*.type.test.ts'],
  setupFiles: [
    'testing/test-setup/src/lib/cliui.mock.ts',
    'testing/test-setup/src/lib/fs.mock.ts',
    'testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
    'testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
    'testing/test-setup/src/lib/extend/path.matcher.ts',
    'testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
  ],
  coverage: { exclude: ['perf/**'] },
});
