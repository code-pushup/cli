import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { configMiddleware } from './config-middleware';

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

  it.each(['ts', 'mjs', 'js'])(
    'should load a valid .%s config',
    async extension => {
      const config = await configMiddleware({
        config: join(configDirPath, `code-pushup.config.${extension}`),
      });
      expect(config.config).toContain(`code-pushup.config.${extension}`);
      expect(config.upload?.project).toContain(extension);
    },
  );

  it('should throw with invalid config path', async () => {
    await expect(
      configMiddleware({ config: 'wrong/path/to/config' }),
    ).rejects.toThrow(/no such file or directory/);
  });
});
