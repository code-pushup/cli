import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setWorkspaceRoot, workspaceRoot } from 'nx/src/utils/workspace-root';
import type { MockInstance } from 'vitest';
import type { ESLintTarget } from './config';
import {
  eslintConfigFromAllNxProjects,
  eslintConfigFromNxProjectAndDeps,
} from './nx';
import { eslintConfigFromNxProject } from './nx/find-project-without-deps';

const ALL_PROJECTS = ['cli', 'core', 'nx-plugin', 'utils'] as const;
type Project = (typeof ALL_PROJECTS)[number];

describe('Nx helpers', () => {
  let cwdSpy: MockInstance<[], string>;
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
      await expect(eslintConfigFromAllNxProjects()).resolves.toEqual([
        {
          eslintrc: './packages/cli/.eslintrc.json',
          patterns: [
            'packages/cli/**/*.ts',
            'packages/cli/*.spec.ts',
            'packages/cli/*.cy.ts',
            'packages/cli/*.stories.ts',
            'packages/cli/.storybook/main.ts',
          ],
        },
        {
          eslintrc: './packages/core/.eslintrc.json',
          patterns: [
            'packages/core/**/*.ts',
            'packages/core/*.spec.ts',
            'packages/core/*.cy.ts',
            'packages/core/*.stories.ts',
            'packages/core/.storybook/main.ts',
          ],
        },
        {
          eslintrc: './packages/nx-plugin/.eslintrc.json',
          patterns: [
            'packages/nx-plugin/**/*.ts',
            'packages/nx-plugin/*.spec.ts',
            'packages/nx-plugin/*.cy.ts',
            'packages/nx-plugin/*.stories.ts',
            'packages/nx-plugin/.storybook/main.ts',
          ],
        },
        {
          eslintrc: './packages/utils/.eslintrc.json',
          patterns: [
            'packages/utils/**/*.ts',
            'packages/utils/*.spec.ts',
            'packages/utils/*.cy.ts',
            'packages/utils/*.stories.ts',
            'packages/utils/.storybook/main.ts',
          ],
        },
      ] satisfies ESLintTarget[]);
    });

    it('should exclude specified projects and return only eslintrc and patterns of a remaining project', async () => {
      await expect(
        eslintConfigFromAllNxProjects({ exclude: ['cli', 'core', 'utils'] }),
      ).resolves.toEqual([
        {
          eslintrc: './packages/nx-plugin/.eslintrc.json',
          patterns: [
            'packages/nx-plugin/**/*.ts',
            'packages/nx-plugin/package.json',
            'packages/nx-plugin/generators.json',
            'packages/nx-plugin/*.spec.ts',
            'packages/nx-plugin/*.cy.ts',
            'packages/nx-plugin/*.stories.ts',
            'packages/nx-plugin/.storybook/main.ts',
          ],
        },
      ] satisfies ESLintTarget[]);
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

    it.each<[Project, Project[]]>([
      ['cli', ['cli', 'core', 'utils']],
      ['core', ['core', 'utils']],
      ['nx-plugin', ['nx-plugin', 'utils']],
      ['utils', ['utils']],
    ])(
      'project %j - expected configurations for projects %j',
      async (project, expectedProjects) => {
        const targets = await eslintConfigFromNxProjectAndDeps(project);

        expect(targets).toEqual(
          expectedProjects.map(
            (p): ESLintTarget => ({
              eslintrc: `./packages/${p}/.eslintrc.json`,
              patterns: expect.arrayContaining([`packages/${p}/**/*.ts`]),
            }),
          ),
        );
      },
    );
  });

  describe('create config from target Nx project without its dependencies', () => {
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

    it.each<[Project]>([['cli'], ['core'], ['utils']])(
      'project %j - expected configurations for projects %j',
      async project => {
        const targets = await eslintConfigFromNxProject(project);

        expect(targets).toEqual({
          eslintrc: `./packages/${project}/.eslintrc.json`,
          patterns: expect.arrayContaining([`packages/${project}/**/*.ts`]),
        });
      },
    );
  });
});
