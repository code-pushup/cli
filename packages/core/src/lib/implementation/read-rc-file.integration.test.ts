import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { readRcByPath } from './read-rc-file';

describe('readRcByPath', () => {
  const configDirPath = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    '..',
    '..',
    '..',
    '..',
    'testing-utils',
    'src',
    'lib',
    'fixtures',
    'configs',
  );

  it('should load the configuration', async () => {
    await expect(
      readRcByPath(join(configDirPath, 'code-pushup.config.js')),
    ).resolves.toEqual(
      expect.objectContaining({
        upload: expect.objectContaining({
          project: 'cli-js',
        }),
        categories: expect.any(Array),
        plugins: expect.arrayContaining([
          expect.objectContaining({
            slug: 'node',
          }),
        ]),
      }),
    );
  });

  it('should throw if the path is empty', async () => {
    await expect(readRcByPath('')).rejects.toThrow(
      'The path to the configuration file is empty.',
    );
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      readRcByPath(join('non-existent', 'config.file.js')),
    ).rejects.toThrow(/Provided path .* is not valid./);
  });

  it('should throw if the configuration is empty', async () => {
    await expect(
      readRcByPath(join(configDirPath, 'code-pushup.empty.config.js')),
    ).rejects.toThrow(`"code": "invalid_type",`);
  });

  it('should throw if the configuration is invalid', async () => {
    await expect(
      readRcByPath(join(configDirPath, 'code-pushup.invalid.config.ts')),
    ).rejects.toThrow(/refs are duplicates/);
  });
});
