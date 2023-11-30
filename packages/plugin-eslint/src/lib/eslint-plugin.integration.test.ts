import os from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { SpyInstance } from 'vitest';
import { PluginConfig, RunnerConfig } from '@code-pushup/models';
import { toUnixPath } from '@code-pushup/utils';
import { eslintPlugin } from './eslint-plugin';

describe('eslintPlugin', () => {
  const fixturesDir = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    '..',
    'mocks',
    'fixtures',
  );

  let cwdSpy: SpyInstance;
  let platformSpy: SpyInstance;

  const replaceAbsolutePath = (plugin: PluginConfig): PluginConfig => ({
    ...plugin,
    runner: {
      ...(plugin.runner as RunnerConfig),
      args: (plugin.runner as RunnerConfig).args?.map(arg =>
        toUnixPath(
          arg.replace(fileURLToPath(dirname(import.meta.url)), '<dirname>'),
        ),
      ),
    },
  });

  beforeAll(() => {
    cwdSpy = vi.spyOn(process, 'cwd');
    // Linux produces extra quotation marks for globs
    platformSpy = vi.spyOn(os, 'platform').mockReturnValue('linux');
  });

  afterAll(() => {
    cwdSpy.mockRestore();
    platformSpy.mockRestore();
  });

  it('should initialize ESLint plugin for React application', async () => {
    cwdSpy.mockReturnValue(join(fixturesDir, 'todos-app'));
    const plugin = await eslintPlugin({
      eslintrc: '.eslintrc.js',
      patterns: ['src/**/*.js', 'src/**/*.jsx'],
    });
    expect(replaceAbsolutePath(plugin)).toMatchSnapshot({
      version: expect.any(String),
    });
  });

  it('should initialize ESLint plugin for Nx project', async () => {
    cwdSpy.mockReturnValue(join(fixturesDir, 'nx-monorepo'));
    const plugin = await eslintPlugin({
      eslintrc: './packages/utils/.eslintrc.json',
      patterns: ['packages/utils/**/*.ts', 'packages/utils/**/*.json'],
    });
    expect(replaceAbsolutePath(plugin)).toMatchSnapshot({
      version: expect.any(String),
    });
  });

  it('should throw when invalid parameters provided', async () => {
    await expect(
      // @ts-expect-error simulating invalid non-TS config
      eslintPlugin({ eslintrc: '.eslintrc.json' }),
    ).rejects.toThrow('patterns');
  });

  it("should throw if eslintrc file doesn't exist", async () => {
    await expect(
      eslintPlugin({ eslintrc: '.eslintrc.yml', patterns: '**/*.js' }),
    ).rejects.toThrow('Cannot read config file');
  });
});
