import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { SpyInstance } from 'vitest';
import { PluginConfig } from '@code-pushup/models';
import { eslintPlugin } from './eslint-plugin';

describe('eslintPlugin', () => {
  const fixturesDir = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    '..',
    'test',
    'fixtures',
  );

  let cwdSpy: SpyInstance;

  const replaceAbsolutePath = (plugin: PluginConfig): PluginConfig => ({
    ...plugin,
    runner: {
      ...plugin.runner,
      args: plugin.runner.args?.map(arg =>
        arg.replace(fileURLToPath(dirname(import.meta.url)), '<dirname>'),
      ),
    },
  });

  beforeAll(() => {
    cwdSpy = vi.spyOn(process, 'cwd');
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  it('should initialize ESLint plugin for React application', async () => {
    cwdSpy.mockReturnValue(join(fixturesDir, 'todos-app'));
    const plugin = await eslintPlugin({
      eslintrc: '.eslintrc.js',
      patterns: ['src/**/*.js', 'src/**/*.jsx'],
    });
    expect(replaceAbsolutePath(plugin)).toMatchSnapshot();
  });

  it('should initialize ESLint plugin for Nx project', async () => {
    cwdSpy.mockReturnValue(join(fixturesDir, 'nx-monorepo'));
    const plugin = await eslintPlugin({
      eslintrc: './packages/utils/.eslintrc.json',
      patterns: ['packages/utils/**/*.ts', 'packages/utils/**/*.json'],
    });
    expect(replaceAbsolutePath(plugin)).toMatchSnapshot();
  });

  it('should throw when invalid parameters provided', async () => {
    await expect(
      // @ts-expect-error simulating invalid non-TS config
      eslintPlugin({ eslintrc: '.eslintrc.json' }),
    ).rejects.toThrowError('patterns');
  });

  it("should throw if eslintrc file doesn't exist", async () => {
    await expect(
      eslintPlugin({ eslintrc: '.eslintrc.yml', patterns: '**/*.js' }),
    ).rejects.toThrowError(
      'Failed to load config ".eslintrc.yml" to extend from',
    );
  });
});
