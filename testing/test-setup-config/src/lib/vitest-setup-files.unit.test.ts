import { describe, expect, it } from 'vitest';
import { getSetupFiles } from './vitest-setup-files.js';

describe('vitest-setup-files', () => {
  describe('getSetupFiles', () => {
    describe('unit test setup files', () => {
      it('should return all required setup files for unit tests', () => {
        const setupFiles = getSetupFiles('unit');

        expect(setupFiles).toHaveLength(10);
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/console.mock.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/reset.mocks.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/cliui.mock.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/fs.mock.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/git.mock.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/portal-client.mock.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/path.matcher.ts',
        );
      });
    });

    describe('integration test setup files', () => {
      it('should return exactly 8 setup files with essential mocks and custom matchers', () => {
        const setupFiles = getSetupFiles('int');

        expect(setupFiles).toHaveLength(8);
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/console.mock.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/reset.mocks.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/chrome-path.mock.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/logger.mock.ts',
        );
      });

      it('should include custom matchers for integration tests', () => {
        const setupFiles = getSetupFiles('int');

        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/path.matcher.ts',
        );
      });

      it('should NOT include fs, cliui, git, and portal-client mocks for integration tests', () => {
        const setupFiles = getSetupFiles('int');

        expect(setupFiles).not.toContain(
          '../../testing/test-setup/src/lib/fs.mock.ts',
        );
        expect(setupFiles).not.toContain(
          '../../testing/test-setup/src/lib/cliui.mock.ts',
        );
        expect(setupFiles).not.toContain(
          '../../testing/test-setup/src/lib/git.mock.ts',
        );
        expect(setupFiles).not.toContain(
          '../../testing/test-setup/src/lib/portal-client.mock.ts',
        );
      });
    });

    describe('e2e test setup files', () => {
      it('should return exactly 5 setup files with minimal mocks', () => {
        const setupFiles = getSetupFiles('e2e');

        expect(setupFiles).toHaveLength(5);
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/reset.mocks.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
        );
        expect(setupFiles).toContain(
          '../../testing/test-setup/src/lib/extend/path.matcher.ts',
        );
      });

      it('should NOT include any other mocks for e2e tests', () => {
        const setupFiles = getSetupFiles('e2e');

        expect(setupFiles).not.toContain(
          '../../testing/test-setup/src/lib/console.mock.ts',
        );
        expect(setupFiles).not.toContain(
          '../../testing/test-setup/src/lib/fs.mock.ts',
        );
        expect(setupFiles).not.toContain(
          '../../testing/test-setup/src/lib/git.mock.ts',
        );
        expect(setupFiles).not.toContain(
          '../../testing/test-setup/src/lib/cliui.mock.ts',
        );
        expect(setupFiles).not.toContain(
          '../../testing/test-setup/src/lib/portal-client.mock.ts',
        );
      });
    });

    describe('relative paths', () => {
      it('should return paths relative to config file location', () => {
        const unitFiles = getSetupFiles('unit');
        const intFiles = getSetupFiles('int');
        const e2eFiles = getSetupFiles('e2e');

        [...unitFiles, ...intFiles, ...e2eFiles].forEach(path => {
          expect(path).toMatch(/^\.\.\/\.\.\//);
        });
      });
    });

    describe('return type', () => {
      it('should return a readonly array', () => {
        const setupFiles = getSetupFiles('unit');

        expect(Array.isArray(setupFiles)).toBe(true);
      });
    });

    describe('test kind differences', () => {
      it('should return different setup files for different test kinds', () => {
        const unitFiles = getSetupFiles('unit');
        const intFiles = getSetupFiles('int');
        const e2eFiles = getSetupFiles('e2e');

        expect(unitFiles.length).not.toBe(intFiles.length);
        expect(intFiles.length).not.toBe(e2eFiles.length);
        expect(unitFiles.length).not.toBe(e2eFiles.length);
      });

      it('should show hierarchy: unit has most, e2e has least', () => {
        const unitFiles = getSetupFiles('unit');
        const intFiles = getSetupFiles('int');
        const e2eFiles = getSetupFiles('e2e');

        expect(unitFiles.length).toBeGreaterThan(intFiles.length);
        expect(intFiles.length).toBeGreaterThan(e2eFiles.length);
      });
    });
  });
});
