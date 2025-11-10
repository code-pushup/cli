import { cp } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import type { MockInstance } from 'vitest';
import { restoreNxIgnoredFiles } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';
import type { ESLintTarget } from './config.js';
import { eslintConfigFromNxProject } from './nx/find-project-without-deps.js';
import {
  eslintConfigFromAllNxProjects,
  eslintConfigFromNxProjectAndDeps,
} from './nx/index.js';

type Project = 'cli' | 'core' | 'nx-plugin' | 'utils';

// skipping tests on Windows due to a problem with createProjectGraphAsync that hangs forever, issue seems to be connected to nested git or some other Nx graph related problem https://github.com/nrwl/nx/issues/27494#issuecomment-2633836688
describe.skipIf(process.platform === 'win32')('Nx helpers', () => {
  const thisDir = fileURLToPath(path.dirname(import.meta.url));
  const fixturesDir = path.join(thisDir, '..', '..', 'mocks', 'fixtures');
  const tmpDir = path.join(process.cwd(), 'tmp', 'int', 'plugin-eslint');
  let cwdSpy: MockInstance<[], string>;

  beforeAll(async () => {
    const workspaceDir = path.join(tmpDir, 'nx-monorepo');
    await cp(path.join(fixturesDir, 'nx-monorepo'), workspaceDir, {
      recursive: true,
    });
    await restoreNxIgnoredFiles(workspaceDir);
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceDir);

    // HACK: somehow prevents "Failed to process project graph" errors
    await executeProcess({
      command: 'npx nx graph --file=.nx/graph.json',
      cwd: workspaceDir,
    });
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  describe('create config from all Nx projects', () => {
    it('should include eslintrc and patterns of each project', async () => {
      await expect(eslintConfigFromAllNxProjects()).resolves.toEqual([
        {
          eslintrc: './packages/cli/eslint.config.js',
          patterns: ['packages/cli'],
        },
        {
          eslintrc: './packages/core/eslint.config.js',
          patterns: ['packages/core'],
        },
        {
          eslintrc: './packages/nx-plugin/eslint.config.js',
          patterns: ['packages/nx-plugin'],
        },
        {
          eslintrc: './packages/utils/eslint.config.js',
          patterns: ['packages/utils'],
        },
      ] satisfies ESLintTarget[]);
    });

    it('should exclude specified projects and return only eslintrc and patterns of a remaining project', async () => {
      await expect(
        eslintConfigFromAllNxProjects({ exclude: ['cli', 'core', 'utils'] }),
      ).resolves.toEqual([
        {
          eslintrc: './packages/nx-plugin/eslint.config.js',
          patterns: ['packages/nx-plugin'],
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
              eslintrc: `./packages/${p}/eslint.config.js`,
              patterns: [`packages/${p}`],
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
          eslintrc: `./packages/${project}/eslint.config.js`,
          patterns: [`packages/${project}`],
        });
      },
    );
  });
});
