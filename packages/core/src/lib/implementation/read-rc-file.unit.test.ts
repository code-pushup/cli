import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import type { CoreConfig } from '@code-pushup/models';
import { CORE_CONFIG_MOCK, MEMFS_VOLUME } from '@code-pushup/test-utils';
import { autoloadRc } from './read-rc-file.js';

describe('autoloadRc', () => {
  const serializeConfig = (project: string) => {
    const config: CoreConfig = {
      ...CORE_CONFIG_MOCK,
      upload: { ...CORE_CONFIG_MOCK.upload, project },
    };
    return `export default ${JSON.stringify(config, null, 2)}`;
  };

  it('prioritise a .ts configuration file', async () => {
    vol.fromJSON(
      {
        'code-pushup.config.js': serializeConfig('js'),
        'code-pushup.config.mjs': serializeConfig('mjs'),
        'code-pushup.config.ts': serializeConfig('ts'),
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
        'code-pushup.config.js': serializeConfig('js'),
        'code-pushup.config.mjs': serializeConfig('mjs'),
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
    vol.fromJSON(
      { 'code-pushup.config.js': serializeConfig('js') },
      MEMFS_VOLUME,
    );

    await expect(autoloadRc()).resolves.toEqual(
      expect.objectContaining({
        upload: expect.objectContaining({ project: 'js' }),
      }),
    );
  });

  it('should throw if no configuration file is present', async () => {
    await expect(autoloadRc()).rejects.toThrow(
      `No code-pushup.config.{ts,mjs,js} file present in ${MEMFS_VOLUME}`,
    );
  });
});
