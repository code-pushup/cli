import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { coreConfigMiddleware } from './core-config.middleware.js';

const configDirPath = path.join(
  fileURLToPath(path.dirname(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  'cli',
  'mocks',
  'configs',
);

describe('coreConfigMiddleware', () => {
  const CLI_DEFAULTS = {
    plugins: [],
    onlyPlugins: [],
    skipPlugins: [],
  };

  it('should load a valid .ts config', async () => {
    const config = await coreConfigMiddleware({
      config: path.join(configDirPath, `code-pushup.config.ts`),
      ...CLI_DEFAULTS,
    });
    expect(config.config).toContain(`code-pushup.config.ts`);
    expect(config.upload?.project).toContain('ts');
  });

  it('should load config which relies on provided --tsconfig', async () => {
    await expect(
      coreConfigMiddleware({
        config: path.join(
          configDirPath,
          'code-pushup.needs-tsconfig.config.ts',
        ),
        tsconfig: path.join(configDirPath, 'tsconfig.json'),
        ...CLI_DEFAULTS,
      }),
    ).resolves.toBeTruthy();
  });
});
