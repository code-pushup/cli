import { describe, expect, it } from 'vitest';
import type { TestKind } from './vitest-config-factory.js';
import { getSetupFiles } from './vitest-setup-files.js';

describe('getSetupFiles', () => {
  describe('relative paths', () => {
    it.each<TestKind>(['unit', 'int', 'e2e'])(
      'should return paths for %s-test relative to config file location',
      kind => {
        const setupFiles = getSetupFiles(kind);
        expect(setupFiles).toSatisfyAll<string>(path =>
          /^\.\.\/\.\.\//.test(path),
        );
      },
    );
  });

  describe('return type', () => {
    it('should return an array of strings', () => {
      const setupFiles = getSetupFiles('unit');

      expect(Array.isArray(setupFiles)).toBe(true);
      expect(setupFiles).toSatisfyAll<unknown>(
        item => typeof item === 'string',
      );
    });
  });

  describe('test kind differences', () => {
    it('should return different setup files for different test kinds', () => {
      const unitFiles = getSetupFiles('unit');
      const intFiles = getSetupFiles('int');
      const e2eFiles = getSetupFiles('e2e');

      expect(unitFiles).not.toHaveLength(intFiles.length);
      expect(intFiles).not.toHaveLength(e2eFiles.length);
      expect(unitFiles).not.toHaveLength(e2eFiles.length);
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
