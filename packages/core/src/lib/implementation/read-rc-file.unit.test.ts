import { vol } from 'memfs';
import { describe, expect, vi } from 'vitest';
import { CONFIG_FILE_NAME, CoreConfig } from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import { autoloadRc } from './read-rc-file';

// Mock bundleRequire inside importEsmModule used for fetching config
vi.mock('bundle-require', async () => {
  const { CORE_CONFIG_MOCK }: Record<string, CoreConfig> =
    await vi.importActual('@code-pushup/testing-utils');

  return {
    bundleRequire: vi.fn().mockImplementation((options: {filepath: string}) => {
      console.log('FILEPATH:: ', options);
      const extension = options.filepath?.split('.').slice(-1) || 'no-extension-found';
      return {
        mod: {
          default: {
            ...CORE_CONFIG_MOCK,
            upload: {
              ...CORE_CONFIG_MOCK?.upload,
              project: extension,
            },
          },
        },
      };
    }),
  };
});

describe('autoloadRc', () => {
  it('prioritise a .ts configuration file', async () => {
    vol.fromJSON(
      {
        // this is just here to satisfy the file system check. the file ise served over a mock in bundleRequire
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

  it('should prioritise .mjs configuration file over .js', async () => {
    vol.fromJSON(
      {
        // this is just here to satisfy the file system check. the file ise served over a mock in bundleRequire
        [`${CONFIG_FILE_NAME}.js`]: '',
        [`${CONFIG_FILE_NAME}.mjs`]: '',
      },
      MEMFS_VOLUME,
    );

    await expect(autoloadRc()).resolves.toEqual(
      expect.objectContaining({ upload: expect.any(Object) }),
    );
  });

  it('should load a .js configuration file if no other valid extension exists', async () => {
    vol.fromJSON(
      {
        // this is just here to satisfy the file system check. the file ise served over a mock in bundleRequire
        [`${CONFIG_FILE_NAME}.js`]: '',
      },
      MEMFS_VOLUME,
    );

    await expect(autoloadRc()).resolves.toEqual(
      expect.objectContaining({ upload: 'u' }),
    );
  });

  it('should throw if no configuration file is present', async () => {
    await expect(autoloadRc()).rejects.toThrow(
      'No file code-pushup.config.(ts|mjs|js) present in',
    );
  });
});
