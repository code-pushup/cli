import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setWorkspaceRoot, workspaceRoot } from 'nx/src/utils/workspace-root';
import type { SpyInstance } from 'vitest';
import { ESLintPluginConfig } from './config';
import { eslintConfigFromNxProject, eslintConfigFromNxProjects } from './nx';

describe('Nx helpers', () => {
  let cwdSpy: SpyInstance;
  const originalWorkspaceRoot = workspaceRoot;

  beforeAll(() => {
    const workspaceDir = join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      'mocks',
      'fixtures',
      'nx-monorepo',
    );
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceDir);

    // eslint-disable-next-line functional/immutable-data
    process.env['NX_DAEMON'] = 'false';

    setWorkspaceRoot(workspaceDir);
  });

  afterAll(() => {
    cwdSpy.mockRestore();
    setWorkspaceRoot(originalWorkspaceRoot);
  });

  describe('create config from all Nx projects', () => {
    it('should include eslintrc and patterns of each project', async () => {
      await expect(eslintConfigFromNxProjects()).resolves.toEqual({
        eslintrc: {
          root: true,
          overrides: [
            {
              files: ['packages/cli/**/*.ts', 'packages/cli/package.json'],
              extends: './packages/cli/.eslintrc.json',
            },
            {
              files: ['packages/core/**/*.ts', 'packages/core/package.json'],
              extends: './packages/core/.eslintrc.json',
            },
            {
              files: [
                'packages/nx-plugin/**/*.ts',
                'packages/nx-plugin/package.json',
                'packages/nx-plugin/generators.json',
              ],
              extends: './packages/nx-plugin/.eslintrc.json',
            },
            {
              files: ['packages/utils/**/*.ts', 'packages/utils/package.json'],
              extends: './packages/utils/.eslintrc.json',
            },
          ],
        },
        patterns: [
          'packages/cli/**/*.ts',
          'packages/cli/package.json',
          'packages/cli/src/*.spec.ts',
          'packages/cli/src/*.cy.ts',
          'packages/cli/src/*.stories.ts',
          'packages/cli/src/.storybook/main.ts',

          'packages/core/**/*.ts',
          'packages/core/package.json',
          'packages/core/src/*.spec.ts',
          'packages/core/src/*.cy.ts',
          'packages/core/src/*.stories.ts',
          'packages/core/src/.storybook/main.ts',

          'packages/nx-plugin/**/*.ts',
          'packages/nx-plugin/package.json',
          'packages/nx-plugin/generators.json',
          'packages/nx-plugin/src/*.spec.ts',
          'packages/nx-plugin/src/*.cy.ts',
          'packages/nx-plugin/src/*.stories.ts',
          'packages/nx-plugin/src/.storybook/main.ts',

          'packages/utils/**/*.ts',
          'packages/utils/package.json',
          'packages/utils/src/*.spec.ts',
          'packages/utils/src/*.cy.ts',
          'packages/utils/src/*.stories.ts',
          'packages/utils/src/.storybook/main.ts',
        ],
      } satisfies ESLintPluginConfig);
    });
  });

  describe('create config from target Nx project and its dependencies', () => {
    /*
     * Project graph:
     *
     *   cli
     *    │
     *    │
     *    ▼
     *   core
     *    │        nx-plugin
     *    │           │
     *    ▼           │
     *   utils ◄──────┘
     */

    const ALL_PROJECTS = ['cli', 'core', 'nx-plugin', 'utils'] as const;
    type Project = (typeof ALL_PROJECTS)[number];

    it.each<[Project, Project[]]>([
      ['cli', ['cli', 'core', 'utils']],
      ['core', ['core', 'utils']],
      ['nx-plugin', ['nx-plugin', 'utils']],
      ['utils', ['utils']],
    ])(
      'project %j - expected configurations for projects %j',
      async (project, expectedProjects) => {
        const otherProjects = ALL_PROJECTS.filter(
          p => !expectedProjects.includes(p),
        );

        const config = await eslintConfigFromNxProject(project);

        expect(config.eslintrc).toEqual({
          root: true,
          overrides: expectedProjects.map(p => ({
            files: expect.arrayContaining([`packages/${p}/**/*.ts`]),
            extends: `./packages/${p}/.eslintrc.json`,
          })),
        });

        expect(config.patterns).toEqual(
          expect.arrayContaining(
            expectedProjects.map(p => `packages/${p}/**/*.ts`),
          ),
        );
        expect(config.patterns).toEqual(
          expect.not.arrayContaining(
            otherProjects.map(p => `packages/${p}/**/*.ts`),
          ),
        );
      },
    );
  });
});
