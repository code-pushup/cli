import { Tree, readJson, readNxJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, expect, it } from 'vitest';
import {
  cpuCliVersion,
  cpuModelVersion,
  cpuNxPluginVersion,
  cpuUtilsVersion,
} from '../../utils/versions';
import {
  checkDependenciesInstalled,
  initGenerator,
  moveToDevDependencies,
  updateNxJsonConfig,
} from './generator';
import { InitGeneratorSchema } from './schema';

type PackageJson = {
  devDependencies: Record<string, string>;
};

const cpuTargetName = 'code-pushup';

const devDependencyNames = [
  '@code-pushup/cli',
  '@code-pushup/models',
  '@code-pushup/nx-plugin',
  '@code-pushup/utils',
];

describe('checkDependenciesInstalled', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add dependencies', async () => {
    tree.write('package.json', JSON.stringify({ devDependencies: {} }));

    checkDependenciesInstalled(tree);
    expect(readJson<PackageJson>(tree, 'package.json').devDependencies).toEqual(
      {
        ['@code-pushup/nx-plugin']: cpuNxPluginVersion,
        ['@code-pushup/models']: cpuModelVersion,
        ['@code-pushup/utils']: cpuUtilsVersion,
        ['@code-pushup/cli']: cpuCliVersion,
      },
    );
  });
});

describe('moveToDevDependencies', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should move dependencies', async () => {
    tree.write(
      'package.json',
      JSON.stringify({
        dependencies: {
          ['@code-pushup/nx-plugin']: cpuNxPluginVersion,
        },
        devDependencies: {
          ['@code-pushup/models']: cpuModelVersion,
          ['@code-pushup/utils']: cpuUtilsVersion,
          ['@code-pushup/cli']: cpuCliVersion,
        },
      }),
    );

    moveToDevDependencies(tree);
    expect(readJson<PackageJson>(tree, 'package.json').devDependencies).toEqual(
      {
        ['@code-pushup/nx-plugin']: cpuNxPluginVersion,
        ['@code-pushup/models']: cpuModelVersion,
        ['@code-pushup/utils']: cpuUtilsVersion,
        ['@code-pushup/cli']: cpuCliVersion,
      },
    );
  });
});

describe('updateNxJsonConfig', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should update nx.json', async () => {
    updateNxJsonConfig(tree);
    const nxJson = readNxJson(tree);

    expect(nxJson?.targetDefaults).toEqual(
      expect.objectContaining({
        [cpuTargetName]: { inputs: ['default', '^production'], cache: true },
      }),
    );
  });
});

describe('init generator', () => {
  let tree: Tree;
  const options: InitGeneratorSchema = { skipPackageJson: false };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await initGenerator(tree, options);

    // nx.json
    const nxJson = readNxJson(tree);
    expect(nxJson?.targetDefaults).toEqual(
      expect.objectContaining({
        [cpuTargetName]: expect.any(Object),
      }),
    );

    // package.json
    const pkgJson = readJson<PackageJson>(tree, 'package.json');
    expect(
      Object.keys(pkgJson.devDependencies).filter(dep =>
        devDependencyNames.includes(dep),
      ),
    ).toHaveLength(devDependencyNames.length);
  });

  it('should skip packageJson', async () => {
    await initGenerator(tree, { ...options, skipPackageJson: true });
    // nx.json
    const nxJson = readNxJson(tree);
    expect(nxJson?.targetDefaults).toEqual(
      expect.objectContaining({
        [cpuTargetName]: expect.any(Object),
      }),
    );

    // package.json
    const pkgJson = readJson<PackageJson>(tree, 'package.json');
    expect(
      Object.keys(pkgJson.devDependencies).filter(dep =>
        devDependencyNames.includes(dep),
      ),
    ).toHaveLength(0);
  });
});
