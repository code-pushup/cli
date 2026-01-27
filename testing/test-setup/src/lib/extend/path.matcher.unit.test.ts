import { vol } from 'memfs';
import path from 'node:path';
import * as testUtils from '@code-pushup/test-utils';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';

describe('path-matcher', () => {
  const osAgnosticPathSpy = vi.spyOn(testUtils, 'osAgnosticPath');

  it('should provide "toMatchPath" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'tmp/path/to/file.txt';

    expect(actual).toMatchPath(expected);

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "pathToMatch" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'tmp/path/to/file.txt';

    expect({ path: actual }).toStrictEqual({
      path: expect.pathToMatch(expected),
    });

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "toStartWithPath" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'tmp/path/to';

    expect(actual).toStartWithPath(expected);

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "pathToStartWith" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'tmp/path/to';

    expect({ path: actual }).toStrictEqual({
      path: expect.pathToStartWith(expected),
    });

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "toContainPath" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'path/to';

    expect(actual).toContainPath(expected);

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "pathToContain" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'path/to';

    expect({ path: actual }).toStrictEqual({
      path: expect.pathToContain(expected),
    });

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "toEndWithPath" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'path/to/file.txt';

    expect(actual).toEndWithPath(expected);

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  it('should provide "pathToEndWith" as expect matcher', () => {
    const actual = String.raw`tmp\path\to\file.txt`;
    const expected = 'path/to/file.txt';

    expect({ path: actual }).toStrictEqual({
      path: expect.pathToEndWith(expected),
    });

    expect(osAgnosticPathSpy).toHaveBeenCalledTimes(2);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(actual);
    expect(osAgnosticPathSpy).toHaveBeenCalledWith(expected);
  });

  describe('toMatchDirectoryStructure', () => {
    beforeEach(() => {
      vol.fromJSON({}, MEMFS_VOLUME);
    });

    afterEach(() => {
      vol.reset();
    });

    it('should match basic directory structure with string patterns', async () => {
      const testDir = path.join(MEMFS_VOLUME, 'test-dir');
      vol.fromJSON(
        {
          'test-dir': {
            'file1.txt': 'content1',
            'file2.ts': 'content2',
            subdir: {
              'file3.js': 'content3',
            },
          },
        },
        MEMFS_VOLUME,
      );

      await expect(testDir).toMatchDirectoryStructure([
        'file1.txt',
        'file2.ts',
        'subdir',
        'subdir/file3.js',
      ]);
    });

    it('should match directory structure with regex patterns for filenames', async () => {
      const testDir = path.join(MEMFS_VOLUME, 'test-dir');
      vol.fromJSON(
        {
          'test-dir': {
            'file1.txt': 'content1',
            'file2.ts': 'content2',
            'file3.js': 'content3',
            subdir: {
              'nested.ts': 'content',
            },
          },
        },
        MEMFS_VOLUME,
      );

      await expect(testDir).toMatchDirectoryStructure([
        /\.ts$/,
        /\.js$/,
        /file1\.txt/,
      ]);
    });

    it('should match directory structure with regex patterns for folder names', async () => {
      const testDir = path.join(MEMFS_VOLUME, 'test-dir');
      vol.fromJSON(
        {
          'test-dir': {
            src: {
              'index.ts': 'content',
            },
            dist: {
              'index.js': 'content',
            },
            tests: {
              'test.ts': 'content',
            },
          },
        },
        MEMFS_VOLUME,
      );

      await expect(testDir).toMatchDirectoryStructure([
        /^src$/,
        /^dist$/,
        /^tests$/,
      ]);
    });

    it('should match nested directory structures', async () => {
      const testDir = path.join(MEMFS_VOLUME, 'test-dir');
      vol.fromJSON(
        {
          'test-dir': {
            src: {
              components: {
                'Button.tsx': 'content',
                'Input.tsx': 'content',
              },
              utils: {
                'helpers.ts': 'content',
              },
            },
            dist: {},
          },
        },
        MEMFS_VOLUME,
      );

      await expect(testDir).toMatchDirectoryStructure([
        'src',
        'src/components',
        'src/components/Button.tsx',
        'src/utils',
        'dist',
      ]);
    });

    it('should use OS-agnostic paths for matching', async () => {
      const testDir = path.join(MEMFS_VOLUME, 'test-dir');
      vol.fromJSON(
        {
          'test-dir': {
            'file1.txt': 'content1',
            subdir: {
              'file2.ts': 'content2',
            },
          },
        },
        MEMFS_VOLUME,
      );

      // Use forward slashes even on Windows
      await expect(testDir).toMatchDirectoryStructure([
        'file1.txt',
        'subdir',
        'subdir/file2.ts',
      ]);

      expect(osAgnosticPathSpy).toHaveBeenCalled();
    });

    it('should fail when patterns do not match', async () => {
      const testDir = path.join(MEMFS_VOLUME, 'test-dir');
      vol.fromJSON(
        {
          'test-dir': {
            'file1.txt': 'content1',
            'file2.ts': 'content2',
          },
        },
        MEMFS_VOLUME,
      );

      await expect(async () => {
        await expect(testDir).toMatchDirectoryStructure([
          'file1.txt',
          'missing.js',
        ]);
      }).rejects.toThrow();
    });

    it('should handle non-existent directories', async () => {
      const nonExistentDir = path.join(MEMFS_VOLUME, 'non-existent');

      await expect(async () => {
        await expect(nonExistentDir).toMatchDirectoryStructure(['file.txt']);
      }).rejects.toThrow();
    });

    it('should match with mixed string and RegExp patterns', async () => {
      const testDir = path.join(MEMFS_VOLUME, 'test-dir');
      vol.fromJSON(
        {
          'test-dir': {
            'file1.txt': 'content1',
            'file2.ts': 'content2',
            'file3.js': 'content3',
            subdir: {
              'nested.ts': 'content',
            },
          },
        },
        MEMFS_VOLUME,
      );

      await expect(testDir).toMatchDirectoryStructure([
        'file1.txt',
        /\.ts$/,
        /^subdir$/,
      ]);
    });

    it('should provide "directoryToMatchStructure" as asymmetric matcher', async () => {
      const testDir = path.join(MEMFS_VOLUME, 'test-dir');
      vol.fromJSON(
        {
          'test-dir': {
            'file1.txt': 'content1',
            'file2.ts': 'content2',
          },
        },
        MEMFS_VOLUME,
      );

      await expect({
        directory: testDir,
      }).toStrictEqual({
        directory: expect.directoryToMatchStructure(['file1.txt', /\.ts$/]),
      });
    });

    it('should include both files and folders in structure', async () => {
      const testDir = path.join(MEMFS_VOLUME, 'test-dir');
      vol.fromJSON(
        {
          'test-dir': {
            'file.txt': 'content',
            folder: {
              'nested.txt': 'content',
            },
          },
        },
        MEMFS_VOLUME,
      );

      await expect(testDir).toMatchDirectoryStructure([
        'file.txt',
        'folder',
        'folder/nested.txt',
      ]);
    });
  });
});
