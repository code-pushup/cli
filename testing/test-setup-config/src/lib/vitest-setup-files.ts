import type { TestKind } from './vitest-config-factory.js';

/**
 * Setup files for unit tests.
 *
 * These paths are relative to the config file location (typically `packages/<project>/vitest.unit.config.ts`),
 * which is why they use `../../` to navigate to the workspace root first.
 */
const UNIT_TEST_SETUP_FILES = [
  '../../testing/test-setup/src/lib/console.mock.ts',
  '../../testing/test-setup/src/lib/reset.mocks.ts',
  '../../testing/test-setup/src/lib/cliui.mock.ts',
  '../../testing/test-setup/src/lib/fs.mock.ts',
  '../../testing/test-setup/src/lib/git.mock.ts',
  '../../testing/test-setup/src/lib/portal-client.mock.ts',
  '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
  '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
  '../../testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
  '../../testing/test-setup/src/lib/extend/path.matcher.ts',
] as const;

/**
 * Setup files for integration tests.
 *
 * These paths are relative to the config file location (typically `packages/<project>/vitest.int.config.ts`),
 * which is why they use `../../` to navigate to the workspace root first.
 */
const INT_TEST_SETUP_FILES = [
  '../../testing/test-setup/src/lib/console.mock.ts',
  '../../testing/test-setup/src/lib/reset.mocks.ts',
  '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
  '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
  '../../testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
  '../../testing/test-setup/src/lib/extend/path.matcher.ts',
] as const;

/**
 * Setup files for E2E tests.
 *
 * These paths are relative to the config file location (typically `e2e/<project-e2e>/vitest.e2e.config.ts`),
 * which is why they use `../../` to navigate to the workspace root first.
 */
const E2E_TEST_SETUP_FILES = [
  '../../testing/test-setup/src/lib/reset.mocks.ts',
  '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
  '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
  '../../testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
  '../../testing/test-setup/src/lib/extend/path.matcher.ts',
] as const;

/**
 * Returns the appropriate setup files for the given test kind.
 *
 * @param kind - The type of test (unit, int, or e2e)
 * @returns Array of setup file paths relative to the config file location
 *
 * @example
 * ```typescript
 * const setupFiles = getSetupFiles('unit');
 * // Returns all unit test setup files including mocks and matchers
 * ```
 */
export function getSetupFiles(kind: TestKind): readonly string[] {
  switch (kind) {
    case 'unit':
      return UNIT_TEST_SETUP_FILES;
    case 'int':
      return INT_TEST_SETUP_FILES;
    case 'e2e':
      return E2E_TEST_SETUP_FILES;
  }
}
