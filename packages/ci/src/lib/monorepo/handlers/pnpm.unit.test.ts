import { vol } from 'memfs';
import { join } from 'node:path';
import type { PackageJson } from 'type-fest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import type {
  MonorepoHandlerOptions,
  MonorepoHandlerProjectsContext,
  ProjectConfig,
} from '../tools.js';
import { pnpmHandler } from './pnpm.js';

describe('pnpmHandler', () => {
  const options = {
    cwd: MEMFS_VOLUME,
    task: 'code-pushup',
    parallel: false,
  } as MonorepoHandlerOptions;

  const pkgJsonContent = (content: PackageJson): string =>
    JSON.stringify(content);

  describe('isConfigured', () => {
    it('should detect PNPM workspace when pnpm-workspace.yaml and package.json files exist', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({}),
          'pnpm-workspace.yaml': 'packages:\n- apps/*\n- libs/*\n\n',
        },
        MEMFS_VOLUME,
      );
      await expect(pnpmHandler.isConfigured(options)).resolves.toBe(true);
    });

    it("should NOT detect PNPM workspace when pnpm-workspace.yaml doesn't exist", async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({}),
          'pnpm-lock.yaml': '',
        },
        MEMFS_VOLUME,
      );
      await expect(pnpmHandler.isConfigured(options)).resolves.toBe(false);
    });

    it("should NOT detect PNPM workspace when root package.json doesn't exist", async () => {
      vol.fromJSON(
        {
          'packages/cli/package.json': pkgJsonContent({}),
          'packages/cli/pnpm-lock.yaml': '',
          'packages/core/package.json': pkgJsonContent({}),
          'packages/core/pnpm-lock.yaml': '',
        },
        MEMFS_VOLUME,
      );
      await expect(pnpmHandler.isConfigured(options)).resolves.toBe(false);
    });
  });

  describe('listProjects', () => {
    it('should list all PNPM workspace packages with code-pushup script', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({}),
          'pnpm-workspace.yaml': 'packages:\n- apps/*\n- libs/*\n\n',
          'apps/backend/package.json': pkgJsonContent({
            name: 'backend',
            scripts: { 'code-pushup': 'code-pushup --no-progress' },
            devDependencies: { '@code-pushup/cli': 'latest' },
          }),
          'apps/frontend/package.json': pkgJsonContent({
            name: 'frontend',
            // missing script
          }),
          'libs/shared/package.json': pkgJsonContent({
            name: 'shared',
            scripts: { 'code-pushup': 'code-pushup --no-progress' },
            devDependencies: { '@code-pushup/cli': 'latest' },
          }),
        },
        MEMFS_VOLUME,
      );

      await expect(pnpmHandler.listProjects(options)).resolves.toEqual([
        {
          name: 'backend',
          directory: join(MEMFS_VOLUME, 'apps', 'backend'),
          bin: 'pnpm run code-pushup',
        },
        {
          name: 'shared',
          directory: join(MEMFS_VOLUME, 'libs', 'shared'),
          bin: 'pnpm run code-pushup',
        },
      ] satisfies ProjectConfig[]);
    });

    it('should list all PNPM workspace packages with code-pushup dependency', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({}),
          'pnpm-workspace.yaml': 'packages:\n- apps/*\n- libs/*\n\n',
          'apps/backend/package.json': pkgJsonContent({
            name: 'backend',
            devDependencies: { '@code-pushup/cli': 'latest' },
          }),
          'apps/frontend/package.json': pkgJsonContent({
            name: 'frontend',
            // missing dependency
          }),
          'libs/shared/package.json': pkgJsonContent({
            name: 'shared',
            devDependencies: { '@code-pushup/cli': 'latest' },
          }),
        },
        MEMFS_VOLUME,
      );

      await expect(pnpmHandler.listProjects(options)).resolves.toEqual([
        {
          name: 'backend',
          directory: join(MEMFS_VOLUME, 'apps', 'backend'),
          bin: 'pnpm exec code-pushup',
        },
        {
          name: 'shared',
          directory: join(MEMFS_VOLUME, 'libs', 'shared'),
          bin: 'pnpm exec code-pushup',
        },
      ] satisfies ProjectConfig[]);
    });

    it('should list all PNPM workspace packages when code-pushup installed at root level', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({
            private: true,
            workspaces: ['apps/*', 'libs/*'],
            devDependencies: { '@code-pushup/cli': 'latest' },
          }),
          'pnpm-workspace.yaml': 'packages:\n- apps/*\n- libs/*\n\n',
          'apps/backend/package.json': pkgJsonContent({
            name: 'backend',
          }),
          'apps/frontend/package.json': pkgJsonContent({
            name: 'frontend',
          }),
          'libs/shared/package.json': pkgJsonContent({
            name: 'shared',
          }),
        },
        MEMFS_VOLUME,
      );

      await expect(pnpmHandler.listProjects(options)).resolves.toEqual([
        {
          name: 'backend',
          directory: join(MEMFS_VOLUME, 'apps', 'backend'),
          bin: 'pnpm exec code-pushup',
        },
        {
          name: 'frontend',
          directory: join(MEMFS_VOLUME, 'apps', 'frontend'),
          bin: 'pnpm exec code-pushup',
        },
        {
          name: 'shared',
          directory: join(MEMFS_VOLUME, 'libs', 'shared'),
          bin: 'pnpm exec code-pushup',
        },
      ] satisfies ProjectConfig[]);
    });
  });

  describe('createRunManyCommand', () => {
    const projects: MonorepoHandlerProjectsContext = {
      all: [
        {
          name: 'backend',
          directory: join(MEMFS_VOLUME, 'apps', 'backend'),
          bin: 'pnpm run code-pushup',
        },
        {
          name: 'frontend',
          directory: join(MEMFS_VOLUME, 'apps', 'frontend'),
          bin: 'pnpm run code-pushup',
        },
        {
          name: 'shared',
          directory: join(MEMFS_VOLUME, 'libs', 'shared'),
          bin: 'pnpm run code-pushup',
        },
      ],
    };

    it('should run script for all workspace packages sequentially by default', () => {
      expect(pnpmHandler.createRunManyCommand(options, projects)).toBe(
        'pnpm --recursive --workspace-concurrency=1 code-pushup',
      );
    });

    it('should set parallel flag with default number of jobs', () => {
      expect(
        pnpmHandler.createRunManyCommand(
          { ...options, parallel: true },
          projects,
        ),
      ).toBe('pnpm --recursive --workspace-concurrency=4 code-pushup');
    });

    it('should set parallel flag with custom number of jobs', () => {
      expect(
        pnpmHandler.createRunManyCommand({ ...options, parallel: 5 }, projects),
      ).toBe('pnpm --recursive --workspace-concurrency=5 code-pushup');
    });

    it('should filter workspace packages by list of project names', () => {
      expect(
        pnpmHandler.createRunManyCommand(options, {
          ...projects,
          only: ['frontend', 'shared'],
        }),
      ).toBe(
        'pnpm --recursive --workspace-concurrency=1 --filter=frontend --filter=shared code-pushup',
      );
    });
  });
});
