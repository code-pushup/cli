import { vol } from 'memfs';
import { basename, join } from 'node:path';
import type { PackageJson } from 'type-fest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  hasCodePushUpDependency,
  hasDependency,
  hasScript,
  hasWorkspacesEnabled,
  listPackages,
  listWorkspaces,
  readRootPackageJson,
} from './packages';

const pkgJsonContent = (content: PackageJson) =>
  JSON.stringify(content, null, 2);

describe('listPackages', () => {
  it('should search for all npm packages recursively by default', async () => {
    vol.fromJSON(
      {
        'e2e/package.json': pkgJsonContent({ name: 'e2e' }),
        'package.json': pkgJsonContent({ name: 'example-monorepo' }),
        'packages/cli/package.json': pkgJsonContent({ name: '@example/cli' }),
        'packages/core/package.json': pkgJsonContent({ name: '@example/core' }),
      },
      MEMFS_VOLUME,
    );

    await expect(listPackages(MEMFS_VOLUME)).resolves.toEqual([
      {
        name: 'e2e',
        directory: join(MEMFS_VOLUME, 'e2e'),
        packageJson: { name: 'e2e' },
      },
      {
        name: 'example-monorepo',
        directory: MEMFS_VOLUME,
        packageJson: { name: 'example-monorepo' },
      },
      {
        name: '@example/cli',
        directory: join(MEMFS_VOLUME, 'packages', 'cli'),
        packageJson: { name: '@example/cli' },
      },
      {
        name: '@example/core',
        directory: join(MEMFS_VOLUME, 'packages', 'core'),
        packageJson: { name: '@example/core' },
      },
    ]);
  });

  it('should search for package.json files with custom glob patterns', async () => {
    vol.fromJSON(
      {
        'e2e/package.json': pkgJsonContent({ name: 'e2e' }),
        'package.json': pkgJsonContent({ name: 'example-monorepo' }), // not in patterns
        'packages/cli/package.json': pkgJsonContent({ name: '@example/cli' }),
        'packages/core/package.json': pkgJsonContent({ name: '@example/core' }),
        'scripts/docs/index.js': 'console.log("not yet implemented")', // no package.json
      },
      MEMFS_VOLUME,
    );

    await expect(
      listPackages(MEMFS_VOLUME, ['packages/*', 'e2e', 'scripts/*']),
    ).resolves.toEqual([
      expect.objectContaining({ name: 'e2e' }),
      expect.objectContaining({ name: '@example/cli' }),
      expect.objectContaining({ name: '@example/core' }),
    ]);
  });

  it('should sort packages by package.json path', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({ name: 'example-monorepo' }),
        'packages/core/package.json': pkgJsonContent({ name: '@example/core' }),
        'e2e/package.json': pkgJsonContent({ name: 'e2e' }),
        'packages/cli/package.json': pkgJsonContent({ name: '@example/cli' }),
      },
      MEMFS_VOLUME,
    );

    await expect(listPackages(MEMFS_VOLUME)).resolves.toEqual([
      expect.objectContaining({ name: 'e2e' }),
      expect.objectContaining({ name: 'example-monorepo' }),
      expect.objectContaining({ name: '@example/cli' }),
      expect.objectContaining({ name: '@example/core' }),
    ]);
  });

  it('should use parent folder name if "name" missing in package.json', async () => {
    vol.fromJSON(
      {
        'e2e/package.json': pkgJsonContent({}),
        'package.json': pkgJsonContent({}),
        'packages/cli/package.json': pkgJsonContent({ name: '@example/cli' }),
        'packages/core/package.json': pkgJsonContent({ name: '@example/core' }),
        'packages/utils/package.json': pkgJsonContent({}),
      },
      MEMFS_VOLUME,
    );

    await expect(listPackages(MEMFS_VOLUME)).resolves.toEqual([
      expect.objectContaining({ name: 'e2e' }),
      expect.objectContaining({ name: basename(MEMFS_VOLUME) }),
      expect.objectContaining({ name: '@example/cli' }),
      expect.objectContaining({ name: '@example/core' }),
      expect.objectContaining({ name: 'utils' }),
    ]);
  });
});

describe('listWorkspaces', () => {
  it('should list workspaces named in root package.json', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({
          private: true,
          workspaces: ['ui', 'api'],
        }),
        'api/package.json': pkgJsonContent({ name: 'api' }),
        'e2e/package.json': pkgJsonContent({ name: 'e2e' }), // not in workspaces
        'ui/package.json': pkgJsonContent({ name: 'ui' }),
      },
      MEMFS_VOLUME,
    );

    await expect(listWorkspaces(MEMFS_VOLUME)).resolves.toEqual({
      workspaces: [
        {
          name: 'api',
          directory: join(MEMFS_VOLUME, 'api'),
          packageJson: { name: 'api' },
        },
        {
          name: 'ui',
          directory: join(MEMFS_VOLUME, 'ui'),
          packageJson: { name: 'ui' },
        },
      ],
      rootPackageJson: {
        private: true,
        workspaces: ['ui', 'api'],
      },
    });
  });

  it('should list workspaces matched by glob in root package.json', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({
          private: true,
          workspaces: ['packages/*'],
        }),
        'e2e/package.json': pkgJsonContent({ name: 'e2e' }), // not in workspaces
        'packages/cli/package.json': pkgJsonContent({ name: 'cli' }),
        'packages/core/package.json': pkgJsonContent({ name: 'core' }),
      },
      MEMFS_VOLUME,
    );

    await expect(listWorkspaces(MEMFS_VOLUME)).resolves.toEqual({
      workspaces: [
        {
          name: 'cli',
          directory: join(MEMFS_VOLUME, 'packages', 'cli'),
          packageJson: { name: 'cli' },
        },
        {
          name: 'core',
          directory: join(MEMFS_VOLUME, 'packages', 'core'),
          packageJson: { name: 'core' },
        },
      ],
      rootPackageJson: {
        private: true,
        workspaces: ['packages/*'],
      },
    });
  });

  it('should parse patterns from workspaces object config in root package.json', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({
          private: true,
          workspaces: {
            packages: ['apps/*'],
            nohoist: ['**/mobile'],
          },
        }),
        'apps/desktop/package.json': pkgJsonContent({ name: 'desktop' }),
        'apps/mobile/package.json': pkgJsonContent({ name: 'mobile' }),
      },
      MEMFS_VOLUME,
    );

    await expect(listWorkspaces(MEMFS_VOLUME)).resolves.toEqual({
      workspaces: [
        {
          name: 'desktop',
          directory: join(MEMFS_VOLUME, 'apps', 'desktop'),
          packageJson: { name: 'desktop' },
        },
        {
          name: 'mobile',
          directory: join(MEMFS_VOLUME, 'apps', 'mobile'),
          packageJson: { name: 'mobile' },
        },
      ],
      rootPackageJson: {
        private: true,
        workspaces: {
          packages: ['apps/*'],
          nohoist: ['**/mobile'],
        },
      },
    });
  });
});

describe('hasWorkspacesEnabled', () => {
  it('should identify as NOT enabled if "workspaces" missing in root package.json', async () => {
    vol.fromJSON(
      { 'package.json': pkgJsonContent({ name: 'example', private: true }) },
      MEMFS_VOLUME,
    );
    await expect(hasWorkspacesEnabled(MEMFS_VOLUME)).resolves.toBe(false);
  });

  it('should identify as NOT enabled if `"private": true` missing in root package.json', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({
          name: 'example',
          workspaces: ['packages/*'],
        }),
      },
      MEMFS_VOLUME,
    );
    await expect(hasWorkspacesEnabled(MEMFS_VOLUME)).resolves.toBe(false);
  });

  it('should identify as enabled if private and workspaces array set in root package.json', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({
          private: true,
          workspaces: ['packages/*'],
        }),
      },
      MEMFS_VOLUME,
    );
    await expect(hasWorkspacesEnabled(MEMFS_VOLUME)).resolves.toBe(true);
  });

  it('should identify as enabled if private and workspaces object set in root package.json', async () => {
    vol.fromJSON(
      {
        'package.json': pkgJsonContent({
          private: true,
          workspaces: {
            packages: ['packages/*'],
            nohoist: ['**/react-native'],
          },
        }),
      },
      MEMFS_VOLUME,
    );
    await expect(hasWorkspacesEnabled(MEMFS_VOLUME)).resolves.toBe(true);
  });
});

describe('readRootPackageJson', () => {
  it('should read and parse package.json from current working directory', async () => {
    vol.fromJSON(
      { 'package.json': pkgJsonContent({ name: 'example' }) },
      MEMFS_VOLUME,
    );
    await expect(readRootPackageJson(MEMFS_VOLUME)).resolves.toEqual({
      name: 'example',
    });
  });

  it("should throw if root package.json doesn't exist", async () => {
    vol.fromJSON(
      {
        'api/package.json': pkgJsonContent({ name: 'api' }),
        'ui/package.json': pkgJsonContent({ name: 'ui' }),
      },
      MEMFS_VOLUME,
    );
    await expect(readRootPackageJson(MEMFS_VOLUME)).rejects.toThrow(
      'no such file or directory',
    );
  });

  it("should throw if package.json exists but isn't valid JSON", async () => {
    vol.fromJSON({ 'package.json': '' }, MEMFS_VOLUME);
    await expect(readRootPackageJson(MEMFS_VOLUME)).rejects.toThrow(
      'Unexpected end of JSON input',
    );
  });
});

describe('hasScript', () => {
  it('should return true if script in package.json "scripts"', () => {
    expect(
      hasScript(
        { scripts: { 'code-pushup': 'code-pushup --no-progress' } },
        'code-pushup',
      ),
    ).toBe(true);
  });

  it('should return false if script not in package.json "scripts"', () => {
    expect(hasScript({}, 'code-pushup')).toBe(false);
  });
});

describe('hasDependency', () => {
  it('should return true if package name in "dependencies"', () => {
    expect(hasDependency({ dependencies: { react: '^19.0.0' } }, 'react')).toBe(
      true,
    );
  });

  it('should return true if package name in "devDependencies"', () => {
    expect(hasDependency({ devDependencies: { nx: '20.1.3' } }, 'nx')).toBe(
      true,
    );
  });

  it('should return false if package name is neither in "dependencies" nor "devDependencies"', () => {
    expect(
      hasDependency(
        {
          dependencies: { react: '^19.0.0' },
          devDependencies: { typescript: '5.5.4' },
        },
        'svelte',
      ),
    ).toBe(false);
  });
});

describe('hasCodePushUpDependency', () => {
  it('should return true if @code-pushup/cli in "devDependencies"', () => {
    expect(
      hasCodePushUpDependency({
        devDependencies: { '@code-pushup/cli': '^0.55.0' },
      }),
    ).toBe(true);
  });

  it('should return true if @code-pushup/cli in "dependencies"', () => {
    expect(
      hasCodePushUpDependency({
        dependencies: { '@code-pushup/cli': 'latest' },
      }),
    ).toBe(true);
  });

  it('should return false if @code-pushup/cli is neither in "dependencies" nor "devDependencies"', () => {
    expect(
      hasCodePushUpDependency({
        dependencies: {
          '@code-pushup/models': 'latest',
          '@code-pushup/utils': 'latest',
        },
      }),
    ).toBe(false);
  });
});
