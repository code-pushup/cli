import { vol } from 'memfs';
import type { PackageJson } from 'type-fest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import type { MonorepoHandlerOptions, ProjectConfig } from '../tools';
import { turboHandler } from './turbo';

describe('turboHandler', () => {
  const options = {
    cwd: MEMFS_VOLUME,
    task: 'code-pushup',
    parallel: false,
  } as MonorepoHandlerOptions;

  const pkgJsonContent = (content: PackageJson): string =>
    JSON.stringify(content);
  const turboJsonContent = (content: { tasks: Record<string, object> }) =>
    JSON.stringify(content);

  describe('isConfigured', () => {
    it('should detect Turborepo when turbo.json exists and has code-pushup task', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({}),
          'turbo.json': turboJsonContent({
            tasks: {
              'code-pushup': {
                env: ['CP_API_KEY'],
                outputs: ['.code-pushup'],
              },
            },
          }),
        },
        MEMFS_VOLUME,
      );
      await expect(turboHandler.isConfigured(options)).resolves.toBe(true);
    });

    it("should NOT detect Turborepo when turbo.json doesn't exist", async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({}),
          'pnpm-lock.yaml': '',
        },
        MEMFS_VOLUME,
      );
      await expect(turboHandler.isConfigured(options)).resolves.toBe(false);
    });

    it("should NOT detect Turborepo when turbo.json doesn't include code-pushup task", async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({}),
          'turbo.json': turboJsonContent({
            tasks: {
              build: {
                dependsOn: ['^build'],
                outputs: ['dist/**'],
              },
              lint: {},
              test: {},
              dev: {
                cache: false,
                persistent: true,
              },
            },
          }),
        },
        MEMFS_VOLUME,
      );
      await expect(turboHandler.isConfigured(options)).resolves.toBe(false);
    });
  });

  describe('listProjects', () => {
    it.each([
      [
        'PNPM workspace',
        {
          'package.json': pkgJsonContent({}),
          'pnpm-lock.yaml': '',
          'pnpm-workspace.yaml': 'packages:\n- packages/*\n\n',
        },
      ],
      [
        'Yarn workspaces',
        {
          'package.json': pkgJsonContent({
            private: true,
            workspaces: ['packages/*'],
          }),
          'yarn.lock': '',
        },
      ],
      [
        'NPM workspaces',
        {
          'package.json': pkgJsonContent({
            private: true,
            workspaces: ['packages/*'],
          }),
          'package-lock.json': '',
        },
      ],
    ])(
      'should detect %s and list all packages with code-pushup script',
      async (_, packageManagerFiles) => {
        vol.fromJSON(
          {
            ...packageManagerFiles,
            'turbo.json': turboJsonContent({ tasks: { 'code-pushup': {} } }),
            'e2e/package.json': pkgJsonContent({ name: 'e2e' }), // not in workspace patterns
            'packages/cli/package.json': pkgJsonContent({
              name: '@example/cli',
              scripts: { 'code-pushup': 'code-pushup --no-progress' },
              devDependencies: { '@code-pushup/cli': 'latest' },
            }),
            'packages/core/package.json': pkgJsonContent({
              name: '@example/core',
              scripts: { 'code-pushup': 'code-pushup --no-progress' },
              devDependencies: { '@code-pushup/cli': 'latest' },
            }),
            'packages/utils/package.json': pkgJsonContent({
              name: '@example/utils',
              // missing script
              devDependencies: { '@code-pushup/cli': 'latest' },
            }),
          },
          MEMFS_VOLUME,
        );

        await expect(turboHandler.listProjects(options)).resolves.toEqual([
          {
            name: '@example/cli',
            bin: 'npx turbo run code-pushup --filter=@example/cli --',
          },
          {
            name: '@example/core',
            bin: 'npx turbo run code-pushup --filter=@example/core --',
          },
        ] satisfies ProjectConfig[]);
      },
    );

    it('should throw if no supported package manager configured', async () => {
      vol.fromJSON(
        {
          'package.json': pkgJsonContent({}),
          'package-lock.json': '',
          'turbo.json': turboJsonContent({ tasks: { 'code-pushup': {} } }),
        },
        MEMFS_VOLUME,
      );

      await expect(turboHandler.listProjects(options)).rejects.toThrow(
        'Package manager with workspace configuration not found in Turborepo, expected one of pnpm/yarn/npm',
      );
    });
  });

  describe('createRunManyCommand', () => {
    it('should run script for all projects sequentially by default', () => {
      expect(turboHandler.createRunManyCommand(options)).toBe(
        'npx turbo run code-pushup --concurrency=1 --',
      );
    });

    it('should set parallel flag with default number of jobs', () => {
      expect(
        turboHandler.createRunManyCommand({ ...options, parallel: true }),
      ).toBe('npx turbo run code-pushup --concurrency=10 --');
    });

    it('should set parallel flag with custom number of jobs', () => {
      expect(
        turboHandler.createRunManyCommand({ ...options, parallel: 5 }),
      ).toBe('npx turbo run code-pushup --concurrency=5 --');
    });

    it('should filter projects by list of project names', () => {
      expect(turboHandler.createRunManyCommand(options, ['web', 'cms'])).toBe(
        'npx turbo run code-pushup --filter=web --filter=cms --concurrency=1 --',
      );
    });
  });
});
