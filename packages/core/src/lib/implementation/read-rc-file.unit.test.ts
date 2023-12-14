import { vol } from 'memfs';
import { join } from 'path';
import { describe, expect } from 'vitest';
import { CONFIG_FILE_NAME } from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import { autoloadRc, readRcByPath } from './read-rc-file';

describe('readRcByPath', () => {
  it('should load a valid configuration file', async () => {
    vol.fromJSON(
      {
        [`${CONFIG_FILE_NAME}.ts`]: '',
      },
      MEMFS_VOLUME,
    );
    await expect(
      readRcByPath(join(MEMFS_VOLUME, 'code-pushup.config.ts')),
    ).resolves.toEqual(
      expect.objectContaining({
        upload: expect.objectContaining({
          organization: 'code-pushup',
        }),
        categories: expect.any(Array),
        plugins: expect.arrayContaining([
          expect.objectContaining({
            slug: 'vitest',
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
});

describe('autoloadRc', () => {
  it('should load ts', async () => {
    vol.fromJSON(
      {
        [`${CONFIG_FILE_NAME}.js`]: '',
        [`${CONFIG_FILE_NAME}.mjs`]: '',
        [`${CONFIG_FILE_NAME}.ts`]: '',
      },
      MEMFS_VOLUME,
    );

    await expect(autoloadRc()).resolves.toEqual(
      expect.objectContaining({ upload: expect.any(Object) }),
    );
  });

  it('should load mjs if no ts exists', async () => {
    vol.fromJSON(
      {
        [`${CONFIG_FILE_NAME}.js`]: '',
        [`${CONFIG_FILE_NAME}.mjs`]: '',
      },
      MEMFS_VOLUME,
    );

    await expect(autoloadRc()).resolves.toEqual(
      expect.objectContaining({ upload: expect.any(Object) }),
    );
  });

  it('should load js if no ts or mjs exists', async () => {
    vol.fromJSON(
      {
        [`${CONFIG_FILE_NAME}.js`]: '',
      },
      MEMFS_VOLUME,
    );

    await expect(autoloadRc()).resolves.toEqual(
      expect.objectContaining({ upload: expect.any(Object) }),
    );
  });

  it('should throw if no config file is present', async () => {
    await expect(autoloadRc()).rejects.toThrow(
      'No file code-pushup.config.(ts|mjs|js) present in',
    );
  });
});
