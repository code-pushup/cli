import { Tree, readJson, readNxJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, expect, it } from 'vitest';
import { PACKAGE_NAME } from '../../internal/constants';
import { initGenerator } from './generator';
import { InitGeneratorSchema } from './schema';

type PackageJson = {
  devDependencies: Record<string, string>;
};

const cpTargetName = 'code-pushup';

const devDependencyNames = [
  '@code-pushup/cli',
  '@code-pushup/models',
  PACKAGE_NAME,
  '@code-pushup/utils',
];

describe('init generator', () => {
  let tree: Tree;
  const options: InitGeneratorSchema = { skipPackageJson: false };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', () => {
    initGenerator(tree, options);
    // nx.json
    const targetDefaults = readNxJson(tree)!.targetDefaults!;
    expect(targetDefaults).toHaveProperty(cpTargetName);
    expect(targetDefaults[cpTargetName]).toEqual({
      inputs: ['default', '^production'],
      cache: true,
    });
    // package.json
    const pkgJson = readJson<PackageJson>(tree, 'package.json');
    expect(
      Object.keys(pkgJson.devDependencies).filter(dep =>
        devDependencyNames.includes(dep),
      ),
    ).toHaveLength(devDependencyNames.length);
  });

  it('should skip packageJson', () => {
    initGenerator(tree, { ...options, skipPackageJson: true });
    // nx.json
    const targetDefaults = readNxJson(tree)!.targetDefaults!;
    expect(targetDefaults).toHaveProperty(cpTargetName);
    expect(targetDefaults[cpTargetName]).toEqual({
      inputs: ['default', '^production'],
      cache: true,
    });
    // package.json
    const pkgJson = readJson<PackageJson>(tree, 'package.json');
    expect(
      Object.keys(pkgJson.devDependencies).filter(dep =>
        devDependencyNames.includes(dep),
      ),
    ).toHaveLength(0);
  });
});
