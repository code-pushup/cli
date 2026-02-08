import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeProcess } from '@code-pushup/utils';
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
const helperPath = path.join(
  fileURLToPath(path.dirname(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  'cli',
  'mocks',
  'core-config-middleware.int-helper.ts',
);
const runMiddlewareInCwd = async (configPath: string, tsconfigPath?: string) =>
  await executeProcess({
    command: 'npx',
    args: [
      'tsx',
      helperPath,
      configPath,
      ...(tsconfigPath ? [tsconfigPath] : []),
    ],
    cwd: configDirPath,
  });
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
    const { stdout, code } = await runMiddlewareInCwd(
      'code-pushup.needs-tsconfig.config.ts',
      path.join(configDirPath, 'tsconfig.json'),
    );

    expect(code).toBe(0);
    const output = JSON.parse(stdout);
    expect(output).toStrictEqual({
      success: true,
      config: expect.any(String),
    });
  });
});
