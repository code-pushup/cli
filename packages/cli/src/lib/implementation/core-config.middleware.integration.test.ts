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
  const CLI_DEFAULTS = {
    progress: true,
    verbose: false,
    onlyPlugins: [],
    skipPlugins: [],
  };

  it.each(['ts', 'mjs', 'js'])(
    'should load a valid .%s config',
    async extension => {
      const config = await coreConfigMiddleware({
        config: join(configDirPath, `code-pushup.config.${extension}`),
        ...CLI_DEFAULTS,
      });
      expect(config.config).toContain(`code-pushup.config.${extension}`);
      expect(config.upload?.project).toContain(extension);
    },
  );

  it('should throw with invalid config path', async () => {
    await expect(
      coreConfigMiddleware({ config: 'wrong/path/to/config', ...CLI_DEFAULTS }),
    ).rejects.toThrow(/Provided path .* is not valid./);
  });

  it('should load config which relies on provided --tsconfig', async () => {
    await expect(
      coreConfigMiddleware({
        config: join(configDirPath, 'code-pushup.needs-tsconfig.config.ts'),
        tsconfig: join(configDirPath, 'tsconfig.json'),
        ...CLI_DEFAULTS,
      }),
    ).resolves.toBeTruthy();
  });

  it('should throw if --tsconfig is missing but needed to resolve import', async () => {
    await expect(
      coreConfigMiddleware({
        config: join(configDirPath, 'code-pushup.needs-tsconfig.config.ts'),
        ...CLI_DEFAULTS,
      }),
    ).rejects.toThrow("Cannot find package '@example/custom-plugin'");
  });
});
