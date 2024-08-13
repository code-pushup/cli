import { Tree, logger, readJson, readNxJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, expect, it, vi } from 'vitest';
import { initGenerator } from './generator';
import { InitGeneratorSchema } from './schema';

type PackageJson = {
  devDependencies: Record<string, string>;
};

const cpTargetName = 'code-pushup';

const devDependencyNames = [
  '@code-pushup/cli',
  '@code-pushup/models',
  '@code-pushup/nx-plugin',
  '@code-pushup/utils',
];

describe('init generator', () => {
  let tree: Tree;
  const loggerInfoSpy = vi.spyOn(logger, 'info');
  const options: InitGeneratorSchema = { skipPackageJson: false };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', () => {
    initGenerator(tree, {});
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

  it('should skip package.json', () => {
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
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip updating package.json');
  });

  it('should skip package installation', () => {
    initGenerator(tree, { skipInstall: true });
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
    ).toHaveLength(4);
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip installing packages');
  });

  it('should skip nx.json', () => {
    initGenerator(tree, { ...options, skipNxJson: true });
    // nx.json
    const targetDefaults = readNxJson(tree)!.targetDefaults!;
    expect(targetDefaults).not.toHaveProperty(cpTargetName);
  });
});
