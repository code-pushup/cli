import { vol } from 'memfs';
import { join } from 'node:path';
import type { PackageJson } from 'type-fest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import * as utils from '@code-pushup/utils';
import { DEFAULT_SETTINGS } from '../constants.js';
import type { Settings } from '../models.js';
import {
  type MonorepoProjects,
  listMonorepoProjects,
} from './list-projects.js';

describe('listMonorepoProjects', () => {
  const MONOREPO_SETTINGS: Settings = {
    ...DEFAULT_SETTINGS,
    monorepo: true,
    projects: null,
    task: 'code-pushup',
    nxProjectsFilter: '--with-target={task}',
    directory: MEMFS_VOLUME,
    bin: 'npx --no-install code-pushup',
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    },
  };

  const pkgJsonContent = (content: PackageJson): string =>
    JSON.stringify(content);

  it('should detect projects in Nx monorepo', async () => {
    vi.spyOn(utils, 'executeProcess').mockResolvedValue({
      code: 0,
      stdout: '["backend", "frontend"]',
    } as utils.ProcessResult);

    vol.fromJSON(
      {
        'nx.json': '{}',
        'backend/project.json': JSON.stringify({
          name: 'backend',
          targets: {
            'code-pushup': { executor: '@code-pushup/nx-plugin:cli' },
          },
        }),
        'frontend/project.json': JSON.stringify({
          name: 'frontend',
          targets: {
            'code-pushup': { executor: '@code-pushup/nx-plugin:cli' },
          },
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(listMonorepoProjects(MONOREPO_SETTINGS)).resolves.toEqual({
      tool: 'nx',
      projects: [
        { name: 'backend', bin: 'npx nx run backend:code-pushup --' },
        { name: 'frontend', bin: 'npx nx run frontend:code-pushup --' },
      ],
      runManyCommand: expect.any(Function),
    } satisfies MonorepoProjects);

    expect(utils.executeProcess).toHaveBeenCalledWith<
      Parameters<(typeof utils)['executeProcess']>
    >({
      command: 'npx',
      args: ['nx', 'show', 'projects', '--with-target=code-pushup', '--json'],
      cwd: process.cwd(),
      observer: expect.any(Object),
    });
  });

  it('should detect projects in Turborepo which have code-pushup command', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({
          private: true,
          workspaces: ['frontend/*', 'backend/*'],
          devDependencies: { '@code-pushup/cli': 'latest' },
        }),
        'yarn.lock': '',
        'turbo.json': JSON.stringify({
          tasks: {
            'code-pushup': {
              env: ['CP_API_KEY'],
              outputs: ['.code-pushup'],
            },
          },
        }),
        'backend/api/package.json': pkgJsonContent({
          name: 'api',
          scripts: { 'code-pushup': 'code-pushup --no-progress' },
        }),
        'backend/auth/package.json': pkgJsonContent({
          name: 'auth',
          scripts: { 'code-pushup': 'code-pushup --no-progress' },
        }),
        'e2e/package.json': pkgJsonContent({
          name: 'e2e',
        }),
        'frontend/cms/package.json': pkgJsonContent({
          name: 'cms',
          scripts: { 'code-pushup': 'code-pushup --no-progress' },
        }),
        'frontend/web/package.json': pkgJsonContent({
          name: 'web',
          scripts: { 'code-pushup': 'code-pushup --no-progress' },
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(listMonorepoProjects(MONOREPO_SETTINGS)).resolves.toEqual({
      tool: 'turbo',
      projects: [
        { name: 'api', bin: 'npx turbo run code-pushup --filter=api --' },
        { name: 'auth', bin: 'npx turbo run code-pushup --filter=auth --' },
        { name: 'cms', bin: 'npx turbo run code-pushup --filter=cms --' },
        { name: 'web', bin: 'npx turbo run code-pushup --filter=web --' },
      ],
      runManyCommand: expect.any(Function),
    } satisfies MonorepoProjects);
  });

  it('should detect packages in PNPM workspace with code-pushup script', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({}),
        'pnpm-workspace.yaml': 'packages:\n- apps/*\n- libs/*\n\n',
        'apps/backend/package.json': pkgJsonContent({
          name: 'backend',
          scripts: { 'code-pushup': 'code-pushup' },
        }),
        'apps/frontend/package.json': pkgJsonContent({
          name: 'frontend',
          scripts: { 'code-pushup': 'code-pushup' },
        }),
        'libs/eslint-config/package.json': pkgJsonContent({
          name: '@repo/eslint-config',
        }),
        'libs/utils/package.json': pkgJsonContent({
          name: '@repo/utils',
          scripts: { 'code-pushup': 'code-pushup' },
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(listMonorepoProjects(MONOREPO_SETTINGS)).resolves.toEqual({
      tool: 'pnpm',
      projects: [
        {
          name: 'backend',
          bin: 'pnpm --filter=backend run code-pushup',
        },
        {
          name: 'frontend',
          bin: 'pnpm --filter=frontend run code-pushup',
        },
        {
          name: '@repo/utils',
          bin: 'pnpm --filter=@repo/utils run code-pushup',
        },
      ],
      runManyCommand: expect.any(Function),
    } satisfies MonorepoProjects);
  });

  it('should detect Yarn workspaces with code-pushup installed individually', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({
          private: true,
          workspaces: ['packages/*'],
        }),
        'yarn.lock': '',
        'packages/cli/package.json': pkgJsonContent({
          name: 'cli',
          devDependencies: { '@code-pushup/cli': '^0.42.0' },
        }),
        'packages/core/package.json': pkgJsonContent({
          name: 'core',
          devDependencies: { '@code-pushup/cli': '^0.42.0' },
        }),
        'e2e/package.json': pkgJsonContent({
          name: 'e2e-tests',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(listMonorepoProjects(MONOREPO_SETTINGS)).resolves.toEqual({
      tool: 'yarn',
      projects: [
        { name: 'cli', bin: 'yarn workspace cli exec code-pushup' },
        { name: 'core', bin: 'yarn workspace core exec code-pushup' },
      ],
      runManyCommand: expect.any(Function),
    } satisfies MonorepoProjects);
  });

  it('should detect NPM workspaces when code-pushup installed at root level', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({
          private: true,
          workspaces: ['packages/*'],
          devDependencies: { '@code-pushup/cli': '^0.42.0' },
        }),
        'package-lock.json': '',
        'packages/backend/package.json': pkgJsonContent({
          name: 'backend',
        }),
        'packages/frontend/package.json': pkgJsonContent({
          name: 'frontend',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(listMonorepoProjects(MONOREPO_SETTINGS)).resolves.toEqual({
      tool: 'npm',
      projects: [
        {
          name: 'backend',
          bin: 'npm --workspace=backend exec code-pushup --',
        },
        {
          name: 'frontend',
          bin: 'npm --workspace=frontend exec code-pushup --',
        },
      ],
      runManyCommand: expect.any(Function),
    } satisfies MonorepoProjects);
  });

  it('should list folders matching globs passed as input when no tool detected', async () => {
    vol.fromJSON(
      {
        'frontend/package.json': pkgJsonContent({
          name: 'frontend',
          devDependencies: { '@code-pushup/cli': '^0.42.0' },
        }),
        'backend/auth/package.json': pkgJsonContent({
          name: 'auth',
          devDependencies: { '@code-pushup/cli': '^0.42.0' },
        }),
        'backend/api/package.json': pkgJsonContent({
          name: 'api',
          devDependencies: { '@code-pushup/cli': '^0.42.0' },
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      listMonorepoProjects({
        ...MONOREPO_SETTINGS,
        monorepo: true,
        projects: ['backend/*', 'frontend'],
      }),
    ).resolves.toEqual({
      tool: null,
      projects: [
        {
          name: join('backend', 'api'),
          bin: 'npx --no-install code-pushup',
          directory: join(MEMFS_VOLUME, 'backend', 'api'),
        },
        {
          name: join('backend', 'auth'),
          bin: 'npx --no-install code-pushup',
          directory: join(MEMFS_VOLUME, 'backend', 'auth'),
        },
        {
          name: 'frontend',
          bin: 'npx --no-install code-pushup',
          directory: join(MEMFS_VOLUME, 'frontend'),
        },
      ],
    } satisfies MonorepoProjects);
  });

  it('should list all folders with a package.json when no tool detected and no patterns provided', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({
          name: 'my-app',
          devDependencies: { '@code-pushup/cli': '^0.42.0' },
        }),
        'scripts/generate-token/package.json': pkgJsonContent({}),
        'scripts/db/migrate/package.json': pkgJsonContent({}),
        'scripts/db/seed/package.json': pkgJsonContent({}),
      },
      MEMFS_VOLUME,
    );

    await expect(
      listMonorepoProjects({
        ...MONOREPO_SETTINGS,
        monorepo: true,
        projects: null,
      }),
    ).resolves.toEqual({
      tool: null,
      projects: [
        {
          name: 'my-app',
          bin: 'npx --no-install code-pushup',
          directory: join(MEMFS_VOLUME),
        },
        {
          name: 'migrate',
          bin: 'npx --no-install code-pushup',
          directory: join(MEMFS_VOLUME, 'scripts', 'db', 'migrate'),
        },
        {
          name: 'seed',
          bin: 'npx --no-install code-pushup',
          directory: join(MEMFS_VOLUME, 'scripts', 'db', 'seed'),
        },
        {
          name: 'generate-token',
          bin: 'npx --no-install code-pushup',
          directory: join(MEMFS_VOLUME, 'scripts', 'generate-token'),
        },
      ],
    } satisfies MonorepoProjects);
  });

  it('should prefer tool provided as input (PNPM) over tool which would be auto-detected otherwise (Turborepo)', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({
          devDependencies: { '@code-pushup/cli': '^0.42.0' },
        }),
        'pnpm-workspace.yaml': 'packages:\n- apps/*\n- packages/*\n\n',
        'turbo.json': JSON.stringify({
          tasks: {
            'code-pushup': {},
          },
        }),
        'apps/backoffice/package.json': pkgJsonContent({
          name: 'backoffice',
        }),
        'apps/frontoffice/package.json': pkgJsonContent({
          name: 'frontoffice',
        }),
        'packages/models/package.json': pkgJsonContent({
          name: '@repo/models',
        }),
        'packages/ui/package.json': pkgJsonContent({
          name: '@repo/ui',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      listMonorepoProjects({ ...MONOREPO_SETTINGS, monorepo: 'pnpm' }),
    ).resolves.toEqual({
      tool: 'pnpm',
      projects: [
        {
          name: 'backoffice',
          bin: 'pnpm --filter=backoffice exec code-pushup',
        },
        {
          name: 'frontoffice',
          bin: 'pnpm --filter=frontoffice exec code-pushup',
        },
        {
          name: '@repo/models',
          bin: 'pnpm --filter=@repo/models exec code-pushup',
        },
        {
          name: '@repo/ui',
          bin: 'pnpm --filter=@repo/ui exec code-pushup',
        },
      ],
      runManyCommand: expect.any(Function),
    } satisfies MonorepoProjects);
  });
});
