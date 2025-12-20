import ansis from 'ansis';
import { cp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import type { MockInstance } from 'vitest';
import type { Audit } from '@code-pushup/models';
import {
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { eslintPlugin } from './eslint-plugin.js';

describe('eslintPlugin', () => {
  const thisDir = fileURLToPath(path.dirname(import.meta.url));

  const fixturesDir = path.join(thisDir, '..', '..', 'mocks', 'fixtures');
  const tmpDir = path.join(process.cwd(), 'tmp', 'int', 'plugin-eslint');
  let cwdSpy: MockInstance<[], string>;
  let platformSpy: MockInstance<[], NodeJS.Platform>;

  beforeAll(async () => {
    await cp(
      path.join(fixturesDir, 'nx-monorepo'),
      path.join(tmpDir, 'nx-monorepo'),
      { recursive: true },
    );
    await restoreNxIgnoredFiles(path.join(tmpDir, 'nx-monorepo'));
    await cp(
      path.join(fixturesDir, 'todos-app'),
      path.join(tmpDir, 'todos-app'),
      { recursive: true },
    );
    await restoreNxIgnoredFiles(path.join(tmpDir, 'todos-app'));
    cwdSpy = vi.spyOn(process, 'cwd');
    // Linux produces extra quotation marks for globs
    platformSpy = vi.spyOn(os, 'platform').mockReturnValue('linux');
  });

  afterAll(async () => {
    cwdSpy.mockRestore();
    platformSpy.mockRestore();
    await teardownTestFolder(tmpDir);
  });

  it('should initialize ESLint plugin for React application', async () => {
    cwdSpy.mockReturnValue(path.join(tmpDir, 'todos-app'));

    const plugin = await eslintPlugin({
      eslintrc: 'eslint.config.js',
      patterns: ['src/**/*.js', 'src/**/*.jsx'],
    });

    expect(plugin).toMatchSnapshot({
      version: expect.any(String),
    });
  });

  it('should initialize ESLint plugin for Nx project', async () => {
    cwdSpy.mockReturnValue(path.join(tmpDir, 'nx-monorepo'));
    const plugin = await eslintPlugin({
      eslintrc: './packages/nx-plugin/eslint.config.js',
      patterns: ['packages/nx-plugin/**/*.ts', 'packages/nx-plugin/**/*.json'],
    });

    // expect rule from extended base eslint.config.js
    expect(plugin.audits).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining<Audit>({
          slug: expect.stringMatching(/^nx-enforce-module-boundaries/),
          title: expect.any(String),
          description: expect.stringContaining('sourceTag'),
        }),
        expect.objectContaining<Partial<Audit>>({
          slug: 'nx-nx-plugin-checks',
        }),
      ]),
    );
  });

  it('should initialize with plugin options for custom groups', async () => {
    cwdSpy.mockReturnValue(path.join(tmpDir, 'nx-monorepo'));
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
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      [SchemaValidationError: Invalid [1mESLintPluginOptions[22m
      ✖ Custom group rules must contain at least 1 element
        → at groups[0].rules
      ]
    `);
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
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      [SchemaValidationError: Invalid [1mESLintPluginOptions[22m
      ✖ Custom group rules must contain at least 1 element
        → at groups[0].rules
      ]
    `);
  });

  it('should throw when invalid parameters provided', async () => {
    await expect(
      // @ts-expect-error simulating invalid non-TS config
      eslintPlugin({ eslintrc: '.eslintrc.json' }),
    ).rejects.toThrow(`Invalid ${ansis.bold('ESLintPluginConfig')}`);
  });

  it("should throw if eslintrc file doesn't exist", async () => {
    await expect(
      eslintPlugin({ eslintrc: '.eslintrc.yml', patterns: '**/*.js' }),
    ).rejects.toThrow(/Failed to load url .*\.eslintrc.yml/);
  });

  it('should initialize with artifact options', async () => {
    cwdSpy.mockReturnValue(path.join(tmpDir, 'todos-app'));
    const plugin = await eslintPlugin(
      {
        eslintrc: 'eslint.config.js',
        patterns: ['src/**/*.js'],
      },
      {
        artifacts: {
          artifactsPaths: './artifacts/eslint-output.json',
          generateArtifactsCommand: 'echo "Generating artifacts"',
        },
      },
    );

    expect(plugin.runner).toBeTypeOf('function');
  });
});
