import { Tree, readJson, readNxJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { TargetDefaults } from 'nx/src/config/nx-json';
import { describe, expect, it } from 'vitest';
import { initGenerator } from './generator';
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

describe('init generator', () => {
  let tree: Tree;
  const options: InitGeneratorSchema = { skipPackageJson: false };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await initGenerator(tree, options);
    // nx.json
    const targetDefaults = readNxJson(tree)?.targetDefaults;
    expect(Object.keys(targetDefaults as TargetDefaults)).toContain(
      cpuTargetName,
    );
    const cacheableOperations =
      readNxJson(tree)?.tasksRunnerOptions?.default?.options
        ?.cacheableOperations;
    expect(cacheableOperations).toContain(cpuTargetName);
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
    const targetDefaults = readNxJson(tree)?.targetDefaults;
    expect(Object.keys(targetDefaults as TargetDefaults)).toContain(
      cpuTargetName,
    );
    const cacheableOperations =
      readNxJson(tree)?.tasksRunnerOptions?.default?.options
        ?.cacheableOperations;
    expect(cacheableOperations).toContain(cpuTargetName);
    // package.json
    const pkgJson = readJson<PackageJson>(tree, 'package.json');
    expect(
      Object.keys(pkgJson.devDependencies).filter(dep =>
        devDependencyNames.includes(dep),
      ),
    ).toHaveLength(0);
  });
});
