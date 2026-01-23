import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { coreConfigMiddleware } from './core-config.middleware.js';

const localMocks = path.join(
  fileURLToPath(path.dirname(import.meta.url)),
  '..',
  '..',
  '..',
  'mocks',
  'fixtures',
  'configs',
);

describe('coreConfigMiddleware', () => {
  const CLI_DEFAULTS = {
    plugins: [],
    onlyPlugins: [],
    skipPlugins: [],
  };

  it.each(['ts', 'mjs', 'js'])(
    'should load a valid .%s config',
    async extension => {
      const config = await coreConfigMiddleware({
        config: path.join(localMocks, `code-pushup.config.${extension}`),
        ...CLI_DEFAULTS,
      });
      expect(config.config).toContain(`code-pushup.config.${extension}`);
      expect(config.upload?.project).toContain(extension);
    },
  );

  it('should throw with invalid config path', async () => {
    await expect(
      coreConfigMiddleware({ config: 'wrong/path/to/config', ...CLI_DEFAULTS }),
    ).rejects.toThrow(/File '.*' does not exist/);
  });

  it('should load config which relies on provided --tsconfig', async () => {
    await expect(
      coreConfigMiddleware({
        config: path.join(localMocks, 'code-pushup.needs-tsconfig.config.ts'),
        tsconfig: path.join(localMocks, 'tsconfig.alias.json'),
        ...CLI_DEFAULTS,
      }),
    ).resolves.toBeTruthy();
  });

  it('should throw if --tsconfig is missing but needed to resolve import', async () => {
    await expect(
      coreConfigMiddleware({
        config: path.join(
          localMocks,
          'code-pushup.needs-tsconfig-fail.config.ts',
        ),
        ...CLI_DEFAULTS,
      }),
    ).rejects.toThrow(
      "Cannot find module '@definitely-non-existent-package/custom-plugin'",
    );
  });
});
