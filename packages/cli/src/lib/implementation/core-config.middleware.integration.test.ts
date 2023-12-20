import { vol } from 'memfs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { coreConfigMiddleware } from './core-config.middleware';

describe('configMiddleware', () => {
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

  it('should load code-pushup.config.(ts|mjs|js) by default', async () => {
    vol.fromJSON({
      // this is only needed to pass the file API's, the config is mocked in bundleRequire
      ['code-pushup.config.ts']: '',
    });
    const config = await coreConfigMiddleware({});
    expect(config?.upload?.project).toBe('cli');
  });

  it.each(['ts', 'mjs', 'js'])(
    'should load a valid .%s config',
    async extension => {
      const config = await coreConfigMiddleware({
        config: join(configDirPath, `code-pushup.config.${extension}`),
      });
      expect(config.config).toContain(`code-pushup.config.${extension}`);
      expect(config.upload?.project).toContain(extension);
    },
  );

  it('should throw with invalid config path', async () => {
    await expect(
      coreConfigMiddleware({ config: 'wrong/path/to/config' }),
    ).rejects.toThrow(/Provided path .* is not valid./);
  });
});
