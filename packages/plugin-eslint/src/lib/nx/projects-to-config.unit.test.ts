import { vol } from 'memfs';
import type { MockInstance } from 'vitest';
import { MEMFS_VOLUME, toProjectGraph } from '@code-pushup/test-utils';
import type { ESLintPluginConfig, ESLintTarget } from '../config';
import { nxProjectsToConfig } from './projects-to-config';

describe('nxProjectsToConfig', () => {
  let cwdSpy: MockInstance<[], string>;

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

    expect(config).toEqual<ESLintPluginConfig>([
      {
        eslintrc: './apps/client/.eslintrc.json',
        patterns: expect.arrayContaining(['apps/client/**/*.ts']),
      },
      {
        eslintrc: './apps/server/.eslintrc.json',
        patterns: expect.arrayContaining(['apps/server/**/*.ts']),
      },
      {
        eslintrc: './libs/models/.eslintrc.json',
        patterns: expect.arrayContaining(['libs/models/**/*.ts']),
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

    expect(config).toEqual<ESLintPluginConfig>([
      {
        eslintrc: './libs/models/.eslintrc.json',
        patterns: expect.arrayContaining(['libs/models/**/*.ts']),
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

    expect(config).toEqual<ESLintPluginConfig>([
      {
        eslintrc: './apps/client/.eslintrc.json',
        patterns: expect.arrayContaining(['apps/client/**/*.ts']),
      },
      {
        eslintrc: './apps/server/.eslintrc.json',
        patterns: expect.arrayContaining(['apps/server/**/*.ts']),
      },
    ]);
  });

  it('should use code-pushup.eslintrc.json if available', async () => {
    vol.fromJSON(
      {
        'apps/client/code-pushup.eslintrc.json':
          '{ "eslintrc": "@code-pushup" }',
      },
      MEMFS_VOLUME,
    );
    const projectGraph = toProjectGraph([
      { name: 'client', type: 'app', data: { root: 'apps/client' } },
    ]);

    const config = await nxProjectsToConfig(projectGraph);

    expect(config).toEqual([
      expect.objectContaining<Partial<ESLintTarget>>({
        eslintrc: './apps/client/code-pushup.eslintrc.json',
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

    await expect(nxProjectsToConfig(projectGraph)).resolves.toEqual([
      {
        eslintrc: './apps/client/.eslintrc.json',
        patterns: expect.arrayContaining([
          'apps/client/**/*.ts',
          'apps/client/**/*.html',
        ]),
      },
      {
        eslintrc: './apps/server/.eslintrc.json',
        patterns: expect.arrayContaining(['apps/server/**/*.ts']),
      },
    ] satisfies ESLintPluginConfig);
  });
});
