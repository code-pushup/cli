import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { coreConfigMiddleware } from './core-config.middleware';

const configDirPath = join(
  fileURLToPath(dirname(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  '..',
  'testing',
  'test-utils',
  'src',
  'lib',
  'fixtures',
  'configs',
);

describe('coreConfigMiddleware', () => {
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
