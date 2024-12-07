import os from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MockInstance } from 'vitest';
import type { Audit, PluginConfig, RunnerConfig } from '@code-pushup/models';
import { toUnixPath } from '@code-pushup/utils';
import { eslintPlugin } from './eslint-plugin.js';

describe('eslintPlugin', () => {
  const thisDir = fileURLToPath(dirname(import.meta.url));

  const fixturesDir = join(thisDir, '..', '..', 'mocks', 'fixtures');

  let cwdSpy: MockInstance<[], string>;
  let platformSpy: MockInstance<[], NodeJS.Platform>;

  const replaceAbsolutePath = (plugin: PluginConfig): PluginConfig => ({
    ...plugin,
    runner: {
      ...(plugin.runner as RunnerConfig),
      args: (plugin.runner as RunnerConfig).args?.map(arg =>
        toUnixPath(arg.replace(dirname(thisDir), '<dirname>')),
      ),
      outputFile: toUnixPath((plugin.runner as RunnerConfig).outputFile),
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

    // expect rule from extended base .eslintrc.json
    expect(plugin.audits).toContainEqual(
      expect.objectContaining<Audit>({
        slug: expect.stringMatching(/^nx-enforce-module-boundaries/),
        title: expect.any(String),
        description: expect.stringContaining('sourceTag'),
      }),
    );
    // expect rule from utils project's .eslintrc.json
    expect(plugin.audits).toContainEqual(
      expect.objectContaining<Partial<Audit>>({
        slug: 'nx-dependency-checks',
      }),
    );
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
