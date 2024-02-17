import type {
  ProjectGraph,
  ProjectGraphDependency,
  ProjectGraphProjectNode,
} from '@nx/devkit';
import type { ESLint } from 'eslint';
import { vol } from 'memfs';
import type { SpyInstance } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import type { ESLintPluginConfig } from '../config';
import { nxProjectsToConfig } from './projects-to-config';

describe('nxProjectsToConfig', () => {
  const toProjectGraph = (
    nodes: ProjectGraphProjectNode[],
    dependencies?: Record<string, string[]>,
  ): ProjectGraph => ({
    nodes: Object.fromEntries(
      nodes.map(node => [
        node.name,
        {
          ...node,
          data: {
            targets: {
              lint: {
                options: {
                  lintFilePatterns: `${node.data.root}/**/*.ts`,
                },
              },
            },
            ...node.data,
          },
        },
      ]),
    ),
    dependencies: Object.fromEntries(
      nodes.map(node => [
        node.name,
        dependencies?.[node.name]?.map(
          (target): ProjectGraphDependency => ({
            source: node.name,
            target,
            type: 'static',
          }),
        ) ?? [],
      ]),
    ),
  });

  let cwdSpy: SpyInstance;

  beforeAll(() => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  it('should include all projects by default', async () => {
    const projectGraph = toProjectGraph([
      { name: 'client', type: 'app', data: { root: 'apps/client' } },
      { name: 'server', type: 'app', data: { root: 'apps/server' } },
      { name: 'models', type: 'lib', data: { root: 'libs/models' } },
    ]);

    const config = await nxProjectsToConfig(projectGraph);
    const { overrides } = config.eslintrc as ESLint.ConfigData;

    expect(overrides).toEqual([
      {
        files: ['apps/client/**/*.ts'],
        extends: './apps/client/.eslintrc.json',
      },
      {
        files: ['apps/server/**/*.ts'],
        extends: './apps/server/.eslintrc.json',
      },
      {
        files: ['libs/models/**/*.ts'],
        extends: './libs/models/.eslintrc.json',
      },
    ]);
  });

  it('should filter projects by predicate', async () => {
    const projectGraph = toProjectGraph([
      {
        name: 'client',
        type: 'app',
        data: { root: 'apps/client', projectType: 'application' },
      },
      {
        name: 'server',
        type: 'app',
        data: { root: 'apps/server', projectType: 'application' },
      },
      {
        name: 'models',
        type: 'lib',
        data: { root: 'libs/models', projectType: 'library' },
      },
    ]);

    const config = await nxProjectsToConfig(
      projectGraph,
      project => project.projectType === 'library',
    );

    const { overrides } = config.eslintrc as ESLint.ConfigData;
    expect(overrides).toEqual([
      {
        files: ['libs/models/**/*.ts'],
        extends: './libs/models/.eslintrc.json',
      },
    ]);
  });

  it('should skip projects without lint target', async () => {
    const projectGraph = toProjectGraph([
      {
        name: 'client-e2e',
        type: 'e2e',
        data: {
          root: 'apps/client-e2e',
          targets: {},
        },
      },
      {
        name: 'client',
        type: 'app',
        data: {
          root: 'apps/client',
          targets: {
            lint: { options: { lintFilePatterns: 'apps/client/**/*.ts' } },
          },
        },
      },
      {
        name: 'server',
        type: 'app',
        data: {
          root: 'apps/server',
          targets: {
            lint: { options: { lintFilePatterns: 'apps/server/**/*.ts' } },
          },
        },
      },
    ]);

    const config = await nxProjectsToConfig(projectGraph);

    const { overrides } = config.eslintrc as ESLint.ConfigData;
    expect(overrides).toEqual([
      {
        files: ['apps/client/**/*.ts'],
        extends: './apps/client/.eslintrc.json',
      },
      {
        files: ['apps/server/**/*.ts'],
        extends: './apps/server/.eslintrc.json',
      },
    ]);
  });

  it('should use code-pushup.eslintrc.json if available', async () => {
    vol.fromJSON(
      {
        'apps/client/code-pushup.eslintrc.json':
          '{ "extends": "@code-pushup" }',
      },
      MEMFS_VOLUME,
    );
    const projectGraph = toProjectGraph([
      { name: 'client', type: 'app', data: { root: 'apps/client' } },
    ]);

    const config = await nxProjectsToConfig(projectGraph);

    const { overrides } = config.eslintrc as ESLint.ConfigData;
    expect(overrides).toEqual([
      expect.objectContaining({
        extends: './apps/client/code-pushup.eslintrc.json',
      }),
    ]);
  });

  it("should use each project's lint file patterns", async () => {
    const projectGraph = toProjectGraph([
      {
        name: 'client',
        type: 'app',
        data: {
          root: 'apps/client',
          targets: {
            lint: {
              options: {
                lintFilePatterns: [
                  'apps/client/**/*.ts',
                  'apps/client/**/*.html',
                ],
              },
            },
          },
        },
      },
      {
        name: 'server',
        type: 'app',
        data: {
          root: 'apps/server',
          targets: {
            lint: {
              options: {
                lintFilePatterns: 'apps/server/**/*.ts',
              },
            },
          },
        },
      },
    ]);

    await expect(nxProjectsToConfig(projectGraph)).resolves.toEqual({
      eslintrc: {
        root: true,
        overrides: [
          {
            files: ['apps/client/**/*.ts', 'apps/client/**/*.html'],
            extends: './apps/client/.eslintrc.json',
          },
          {
            files: ['apps/server/**/*.ts'],
            extends: './apps/server/.eslintrc.json',
          },
        ],
      },
      patterns: expect.arrayContaining([
        'apps/client/**/*.ts',
        'apps/client/**/*.html',
        'apps/server/**/*.ts',
      ]),
    } satisfies ESLintPluginConfig);
  });
});
