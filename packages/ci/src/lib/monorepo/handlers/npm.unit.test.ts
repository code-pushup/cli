import { vol } from 'memfs';
import path from 'node:path';
import type { PackageJson } from 'type-fest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import type {
  MonorepoHandlerOptions,
  MonorepoHandlerProjectsContext,
  ProjectConfig,
} from '../tools.js';
import { npmHandler } from './npm.js';

describe('npmHandler', () => {
  const options = {
    cwd: MEMFS_VOLUME,
    task: 'code-pushup',
  } as MonorepoHandlerOptions;

  const pkgJsonContent = (content: PackageJson): string =>
    JSON.stringify(content);

  describe('isConfigured', () => {
    it('should detect NPM workspaces when package-lock.json exists and "workspaces" set in package.json', async () => {
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
      await expect(npmHandler.isConfigured(options)).resolves.toBeTrue();
    });

    it('should NOT detect NPM workspaces when "workspaces" not set in package.json', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({}),
          'package-lock.json': '',
        },
        MEMFS_VOLUME,
      );
      await expect(npmHandler.isConfigured(options)).resolves.toBeFalse();
    });

    it("should NOT detect NPM workspaces when package-lock.json doesn't exist", async () => {
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
      await expect(npmHandler.isConfigured(options)).resolves.toBeFalse();
    });
  });

  describe('listProjects', () => {
    it('should list all NPM workspaces with code-pushup script', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({
            private: true,
            workspaces: ['apps/*', 'libs/*'],
          }),
          'package-lock.json': '',
          'apps/backend/package.json': pkgJsonContent({
            name: 'backend',
            scripts: { 'code-pushup': 'code-pushup' },
            devDependencies: { '@code-pushup/cli': 'latest' },
          }),
          'apps/frontend/package.json': pkgJsonContent({
            name: 'frontend',
            // missing script
          }),
          'libs/shared/package.json': pkgJsonContent({
            name: 'shared',
            scripts: { 'code-pushup': 'code-pushup' },
            devDependencies: { '@code-pushup/cli': 'latest' },
          }),
        },
        MEMFS_VOLUME,
      );

      await expect(npmHandler.listProjects(options)).resolves.toEqual([
        {
          name: 'backend',
          directory: path.join(MEMFS_VOLUME, 'apps', 'backend'),
          bin: 'npm run code-pushup --',
        },
        {
          name: 'shared',
          directory: path.join(MEMFS_VOLUME, 'libs', 'shared'),
          bin: 'npm run code-pushup --',
        },
      ] satisfies ProjectConfig[]);
    });

    it('should list all NPM workspaces with code-pushup dependency', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({
            private: true,
            workspaces: ['apps/*', 'libs/*'],
          }),
          'package-lock.json': '',
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

      await expect(npmHandler.listProjects(options)).resolves.toEqual([
        {
          name: 'backend',
          directory: path.join(MEMFS_VOLUME, 'apps', 'backend'),
          bin: 'npm exec code-pushup --',
        },
        {
          name: 'shared',
          directory: path.join(MEMFS_VOLUME, 'libs', 'shared'),
          bin: 'npm exec code-pushup --',
        },
      ] satisfies ProjectConfig[]);
    });

    it('should list all NPM workspaces when code-pushup installed at root level', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({
            private: true,
            workspaces: ['apps/*', 'libs/*'],
            devDependencies: { '@code-pushup/cli': 'latest' },
          }),
          'package-lock.json': '',
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

      await expect(npmHandler.listProjects(options)).resolves.toEqual([
        {
          name: 'backend',
          directory: path.join(MEMFS_VOLUME, 'apps', 'backend'),
          bin: 'npm exec code-pushup --',
        },
        {
          name: 'frontend',
          directory: path.join(MEMFS_VOLUME, 'apps', 'frontend'),
          bin: 'npm exec code-pushup --',
        },
        {
          name: 'shared',
          directory: path.join(MEMFS_VOLUME, 'libs', 'shared'),
          bin: 'npm exec code-pushup --',
        },
      ] satisfies ProjectConfig[]);
    });
  });

  describe('createRunManyCommand', () => {
    const projects: MonorepoHandlerProjectsContext = {
      all: [
        {
          name: 'api',
          directory: path.join(MEMFS_VOLUME, 'api'),
          bin: 'npm run code-pushup --',
        },
        {
          name: 'ui',
          directory: path.join(MEMFS_VOLUME, 'ui'),
          bin: 'npm run code-pushup --',
        },
      ],
    };

    it('should create command to run npm script for all workspaces', () => {
      expect(npmHandler.createRunManyCommand(options, projects)).toBe(
        'npm run code-pushup --workspaces --if-present --',
      );
    });
  });
});
