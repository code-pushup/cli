import {
  type MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { osAgnosticPath } from './os-agnostic-paths.js';

describe('osAgnosticPath', () => {
  const cwdSpy: MockInstance<[], string> = vi.spyOn(process, 'cwd');

  it('should forward nullish paths on Linux/macOS and Windows', () => {
    expect(osAgnosticPath(undefined)).toBeUndefined();
  });

  describe('Unix-based systems (Linux/macOS)', () => {
    const unixCwd = '/Users/jerry';

    beforeEach(() => {
      cwdSpy.mockReturnValue(unixCwd);
    });

    afterEach(() => {
      cwdSpy.mockReset();
    });

    it('should convert a path within the CWD to an OS-agnostic path on Linux/macOS', () => {
      expect(
        osAgnosticPath(`${unixCwd}/.code-pushup/.code-pushup.config.ts`),
      ).toBe('<CWD>/.code-pushup/.code-pushup.config.ts');
    });

    it('should return paths outside of CWD on Linux/macOS', () => {
      expect(
        osAgnosticPath(`${unixCwd}/../.code-pushup/.code-pushup.config.ts`),
      ).toBe('../.code-pushup/.code-pushup.config.ts');
    });

    it('should handle absolute paths correctly on Linux/macOS', () => {
      expect(osAgnosticPath('/.code-pushup/.code-pushup.config.ts')).toBe(
        '/.code-pushup/.code-pushup.config.ts',
      );
    });

    it('should handle paths with CWD shorthand "." correctly on Linux/macOS', () => {
      expect(osAgnosticPath('./.code-pushup/.code-pushup.config.ts')).toBe(
        './.code-pushup/.code-pushup.config.ts',
      );
    });

    it('should handle relative paths correctly on Linux/macOS', () => {
      expect(osAgnosticPath('../../.code-pushup/.code-pushup.config.ts')).toBe(
        '../../.code-pushup/.code-pushup.config.ts',
      );
    });

    it('should handle path segments correctly on Linux/macOS', () => {
      expect(osAgnosticPath('.code-pushup/.code-pushup.config.ts')).toBe(
        '.code-pushup/.code-pushup.config.ts',
      );
    });

    it('should NOT modify already OS-agnostic paths on Linux/macOS', () => {
      expect(osAgnosticPath('<CWD>/.code-pushup/.code-pushup.config.ts')).toBe(
        '<CWD>/.code-pushup/.code-pushup.config.ts',
      );
    });
  });

  describe('Windows', () => {
    const windowsCWD = String.raw`D:\users\jerry`;

    beforeEach(() => {
      cwdSpy.mockReturnValue(windowsCWD);
    });

    afterEach(() => {
      cwdSpy.mockReset();
    });

    it('should return paths outside of CWD on Windows', () => {
      expect(
        osAgnosticPath(
          `${windowsCWD}\\..\\.code-pushup\\.code-pushup.config.ts`,
        ),
      ).toBe('../.code-pushup/.code-pushup.config.ts');
    });

    it('should convert a path within the CWD to an OS-agnostic path on Windows', () => {
      expect(
        osAgnosticPath(`${windowsCWD}\\.code-pushup\\.code-pushup.config.ts`),
      ).toBe('<CWD>/.code-pushup/.code-pushup.config.ts');
    });

    it('should handle absolute paths correctly on Windows', () => {
      expect(
        osAgnosticPath(String.raw`\.code-pushup\.code-pushup.config.ts`),
      ).toBe('/.code-pushup/.code-pushup.config.ts');
    });

    it('should handle paths with CWD shorthand "." correctly on Windows', () => {
      expect(
        osAgnosticPath(String.raw`.\.code-pushup\.code-pushup.config.ts`),
      ).toBe('./.code-pushup/.code-pushup.config.ts');
    });

    it('should handle relative paths correctly on Windows', () => {
      expect(
        osAgnosticPath(String.raw`..\..\.code-pushup\.code-pushup.config.ts`),
      ).toBe('../../.code-pushup/.code-pushup.config.ts');
    });

    it('should handle path segments correctly on Windows', () => {
      expect(
        osAgnosticPath(String.raw`.code-pushup\.code-pushup.config.ts`),
      ).toBe('.code-pushup/.code-pushup.config.ts');
    });
  });
});
