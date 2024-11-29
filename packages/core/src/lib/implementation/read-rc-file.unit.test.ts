import { vol } from 'memfs';
import { describe, expect, vi } from 'vitest';
import { CONFIG_FILE_NAME, type CoreConfig } from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { autoloadRc } from './read-rc-file.js';

// mock bundleRequire inside importEsmModule used for fetching config
vi.mock('bundle-require', async () => {
  const { CORE_CONFIG_MOCK }: Record<string, CoreConfig> =
    await vi.importActual('@code-pushup/test-utils');

  return {
    bundleRequire: vi
      .fn()
      .mockImplementation((options: { filepath: string }) => {
        const extension = options.filepath.split('.').at(-1);
        return {
          mod: {
            default: {
              ...CORE_CONFIG_MOCK,
              upload: {
                ...CORE_CONFIG_MOCK?.upload,
                project: extension, // returns loaded file extension to check format precedence
              },
            },
          },
        };
      }),
  };
});

// Note: memfs files are only listed to satisfy a system check, value is used from bundle-require mock
describe('autoloadRc', () => {
  it('prioritise a .ts configuration file', async () => {
    vol.fromJSON(
      {
        [`${CONFIG_FILE_NAME}.js`]: '',
        [`${CONFIG_FILE_NAME}.mjs`]: '',
        [`${CONFIG_FILE_NAME}.ts`]: '',
      },
      MEMFS_VOLUME,
    );

    await expect(autoloadRc()).resolves.toEqual(
      expect.objectContaining({
        upload: expect.objectContaining({ project: 'ts' }),
      }),
    );
  });

  it('should prioritise .mjs configuration file over .js', async () => {
    vol.fromJSON(
      {
        [`${CONFIG_FILE_NAME}.js`]: '',
        [`${CONFIG_FILE_NAME}.mjs`]: '',
      },
      MEMFS_VOLUME,
    );

    await expect(autoloadRc()).resolves.toEqual(
      expect.objectContaining({
        upload: expect.objectContaining({ project: 'mjs' }),
      }),
    );
  });

  it('should load a .js configuration file if no other valid extension exists', async () => {
    vol.fromJSON({ [`${CONFIG_FILE_NAME}.js`]: '' }, MEMFS_VOLUME);

    await expect(autoloadRc()).resolves.toEqual(
      expect.objectContaining({
        upload: expect.objectContaining({ project: 'js' }),
      }),
    );
  });

  it('should throw if no configuration file is present', async () => {
    await expect(autoloadRc()).rejects.toThrow(
      'No file code-pushup.config.(ts|mjs|js) present in',
    );
  });
});
