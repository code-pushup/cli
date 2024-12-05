import { vol } from 'memfs';
import type { PackageJson } from 'type-fest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import * as utils from '@code-pushup/utils';
import type {
  MonorepoHandlerOptions,
  MonorepoHandlerProjectsContext,
  ProjectConfig,
} from '../tools';
import { yarnHandler } from './yarn';

describe('yarnHandler', () => {
  const options = {
    cwd: MEMFS_VOLUME,
    task: 'code-pushup',
    parallel: false,
  } as MonorepoHandlerOptions;

  const pkgJsonContent = (content: PackageJson): string =>
    JSON.stringify(content);

  describe('isConfigured', () => {
    it('should detect Yarn workspaces when yarn.lock exists and "workspaces" set in package.json', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({
            private: true,
            workspaces: ['packages/*'],
          }),
          'yarn.lock': '',
        },
        MEMFS_VOLUME,
      );
      await expect(yarnHandler.isConfigured(options)).resolves.toBe(true);
    });

    it('should NOT detect Yarn workspaces when "workspaces" not set in package.json', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({}),
          'yarn.lock': '',
        },
        MEMFS_VOLUME,
      );
      await expect(yarnHandler.isConfigured(options)).resolves.toBe(false);
    });

    it("should NOT detect Yarn workspaces when yarn.lock doesn't exist", async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({
            private: true,
            workspaces: ['packages/*'],
          }),
          'package-lock.json': '',
        },
        MEMFS_VOLUME,
      );
      await expect(yarnHandler.isConfigured(options)).resolves.toBe(false);
    });
  });

  describe('listProjects', () => {
    it('should list all Yarn workspaces with code-pushup script', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({
            private: true,
            workspaces: ['apps/*', 'libs/*'],
          }),
          'yarn.lock': '',
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

      await expect(yarnHandler.listProjects(options)).resolves.toEqual([
        {
          name: 'backend',
          bin: 'yarn workspace backend run code-pushup',
        },
        {
          name: 'shared',
          bin: 'yarn workspace shared run code-pushup',
        },
      ] satisfies ProjectConfig[]);
    });

    it('should list all Yarn workspaces with code-pushup dependency', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({
            private: true,
            workspaces: ['apps/*', 'libs/*'],
          }),
          'yarn.lock': '',
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

      await expect(yarnHandler.listProjects(options)).resolves.toEqual([
        {
          name: 'backend',
          bin: 'yarn workspace backend exec code-pushup',
        },
        {
          name: 'shared',
          bin: 'yarn workspace shared exec code-pushup',
        },
      ] satisfies ProjectConfig[]);
    });

    it('should list all Yarn workspaces when code-pushup installed at root level', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({
            private: true,
            workspaces: ['apps/*', 'libs/*'],
            devDependencies: { '@code-pushup/cli': 'latest' },
          }),
          'yarn.lock': '',
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

      await expect(yarnHandler.listProjects(options)).resolves.toEqual([
        {
          name: 'backend',
          bin: 'yarn workspace backend exec code-pushup',
        },
        {
          name: 'frontend',
          bin: 'yarn workspace frontend exec code-pushup',
        },
        {
          name: 'shared',
          bin: 'yarn workspace shared exec code-pushup',
        },
      ] satisfies ProjectConfig[]);
    });
  });

  describe('createRunManyCommand', () => {
    const projects: MonorepoHandlerProjectsContext = {
      all: [
        { name: 'api', bin: 'yarn workspace api run code-pushup' },
        { name: 'cms', bin: 'yarn workspace cms run code-pushup' },
        { name: 'web', bin: 'yarn workspace web run code-pushup' },
      ],
    };

    // eslint-disable-next-line vitest/max-nested-describe
    describe('classic Yarn (v1)', () => {
      beforeEach(() => {
        vi.spyOn(utils, 'executeProcess').mockResolvedValue({
          stdout: '1.22.19',
        } as utils.ProcessResult);
      });

      it('should run script for all workspaces sequentially', async () => {
        await expect(
          yarnHandler.createRunManyCommand(options, projects),
        ).resolves.toBe('yarn workspaces run code-pushup');
      });
    });

    // eslint-disable-next-line vitest/max-nested-describe
    describe('modern Yarn (v2+)', () => {
      beforeEach(() => {
        vi.spyOn(utils, 'executeProcess').mockResolvedValue({
          stdout: '4.5.0',
        } as utils.ProcessResult);
      });

      it('should run script for all workspaces sequentially by default', async () => {
        await expect(
          yarnHandler.createRunManyCommand(options, projects),
        ).resolves.toBe('yarn workspaces foreach --all code-pushup');
      });

      it('should set parallel flag with default number of jobs', async () => {
        await expect(
          yarnHandler.createRunManyCommand(
            { ...options, parallel: true },
            projects,
          ),
        ).resolves.toBe('yarn workspaces foreach --parallel --all code-pushup');
      });

      it('should set parallel flag with custom number of jobs', async () => {
        await expect(
          yarnHandler.createRunManyCommand(
            { ...options, parallel: 5 },
            projects,
          ),
        ).resolves.toBe(
          'yarn workspaces foreach --parallel --jobs=5 --all code-pushup',
        );
      });

      it('should filter workspaces by list of project names', async () => {
        await expect(
          yarnHandler.createRunManyCommand(options, {
            ...projects,
            only: ['api', 'cms'],
          }),
        ).resolves.toBe(
          'yarn workspaces foreach --include=api --include=cms code-pushup',
        );
      });
    });
  });
});
