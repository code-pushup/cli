import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import type { MockInstance } from 'vitest';
import type { Audit, PluginConfig, RunnerConfig } from '@code-pushup/models';
import { toUnixPath } from '@code-pushup/utils';
import { eslintPlugin } from './eslint-plugin.js';

describe('eslintPlugin', () => {
  const thisDir = fileURLToPath(path.dirname(import.meta.url));

  const fixturesDir = path.join(thisDir, '..', '..', 'mocks', 'fixtures');

  let cwdSpy: MockInstance<[], string>;
  let platformSpy: MockInstance<[], NodeJS.Platform>;

  const replaceAbsolutePath = (plugin: PluginConfig): PluginConfig => ({
    ...plugin,
    runner: {
      ...(plugin.runner as RunnerConfig),
      args: (plugin.runner as RunnerConfig).args?.map(arg =>
        toUnixPath(arg.replace(path.dirname(thisDir), '<dirname>')).replace(
          /\/eslint\/\d+\//,
          '/eslint/<timestamp>/',
        ),
      ),
      ...((plugin.runner as RunnerConfig).configFile && {
        configFile: toUnixPath(
          (plugin.runner as RunnerConfig).configFile!,
        ).replace(/\/eslint\/\d+\//, '/eslint/<timestamp>/'),
      }),
      outputFile: toUnixPath(
        (plugin.runner as RunnerConfig).outputFile,
      ).replace(/\/eslint\/\d+\//, '/eslint/<timestamp>/'),
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
    cwdSpy.mockReturnValue(path.join(fixturesDir, 'todos-app'));

    const plugin = await eslintPlugin({
      eslintrc: 'eslint.config.js',
      patterns: ['src/**/*.js', 'src/**/*.jsx'],
    });

    expect(replaceAbsolutePath(plugin)).toMatchSnapshot({
      version: expect.any(String),
    });
  });

  it('should initialize ESLint plugin for Nx project', async () => {
    cwdSpy.mockReturnValue(path.join(fixturesDir, 'nx-monorepo'));
    const plugin = await eslintPlugin({
      eslintrc: './packages/nx-plugin/eslint.config.js',
      patterns: ['packages/nx-plugin/**/*.ts', 'packages/nx-plugin/**/*.json'],
    });

    // expect rule from extended base eslint.config.js
    expect(plugin.audits).toContainEqual(
      expect.objectContaining<Audit>({
        slug: expect.stringMatching(/^nx-enforce-module-boundaries/),
        title: expect.any(String),
        description: expect.stringContaining('sourceTag'),
      }),
    );
    // expect rule from nx-plugin project's eslint.config.js
    expect(plugin.audits).toContainEqual(
      expect.objectContaining<Partial<Audit>>({
        slug: 'nx-nx-plugin-checks',
      }),
    );
  });

  it('should initialize with plugin options for custom groups', async () => {
    cwdSpy.mockReturnValue(path.join(fixturesDir, 'nx-monorepo'));
    const plugin = await eslintPlugin(
      {
        eslintrc: './packages/nx-plugin/eslint.config.js',
        patterns: ['packages/nx-plugin/**/*.ts'],
      },
      {
        groups: [
          {
            slug: 'type-safety',
            title: 'Type safety',
            rules: [
              '@typescript-eslint/no-explicit-any',
              '@typescript-eslint/no-unsafe-*',
            ],
          },
        ],
      },
    );

    expect(plugin.groups).toContainEqual({
      slug: 'type-safety',
      title: 'Type safety',
      refs: [
        { slug: 'typescript-eslint-no-explicit-any', weight: 1 },
        {
          slug: 'typescript-eslint-no-unsafe-declaration-merging',
          weight: 1,
        },
        { slug: 'typescript-eslint-no-unsafe-function-type', weight: 1 },
      ],
    });
    expect(plugin.audits).toContainEqual(
      expect.objectContaining<Partial<Audit>>({
        slug: 'typescript-eslint-no-explicit-any',
      }),
    );
  });

  it('should throw when custom group rules are empty', async () => {
    await expect(
      eslintPlugin(
        {
          eslintrc: './packages/nx-plugin/eslint.config.js',
          patterns: ['packages/nx-plugin/**/*.ts'],
        },
        {
          groups: [{ slug: 'type-safety', title: 'Type safety', rules: [] }],
        },
      ),
    ).rejects.toThrow(/Custom group rules must contain at least 1 element/);
    await expect(
      eslintPlugin(
        {
          eslintrc: './packages/nx-plugin/eslint.config.js',
          patterns: ['packages/nx-plugin/**/*.ts'],
        },
        {
          groups: [{ slug: 'type-safety', title: 'Type safety', rules: {} }],
        },
      ),
    ).rejects.toThrow(/Custom group rules must contain at least 1 element/);
  });

  it('should throw when invalid parameters provided', async () => {
    await expect(
      // @ts-expect-error simulating invalid non-TS config
      eslintPlugin({ eslintrc: '.eslintrc.json' }),
    ).rejects.toThrow(/Invalid input/);
  });

  it("should throw if eslintrc file doesn't exist", async () => {
    await expect(
      eslintPlugin({ eslintrc: '.eslintrc.yml', patterns: '**/*.js' }),
    ).rejects.toThrow(/Failed to load url .*\.eslintrc.yml/);
  });
});
