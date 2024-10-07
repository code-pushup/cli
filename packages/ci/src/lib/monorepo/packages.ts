import { glob } from 'glob';
import { basename, dirname, join } from 'node:path';
import type { PackageJson } from 'type-fest';
import { readJsonFile } from '@code-pushup/utils';

type WorkspacePackage = {
  name: string;
  directory: string;
  packageJson: PackageJson;
};

export async function listPackages(
  cwd: string,
  patterns: string[] = ['**'],
): Promise<WorkspacePackage[]> {
  const files = await glob(
    patterns.map(pattern => pattern.replace(/\/?$/, '/package.json')),
    { cwd },
  );

  return Promise.all(
    files.toSorted().map(async (file): Promise<WorkspacePackage> => {
      const packageJson = await readJsonFile<PackageJson>(join(cwd, file));
      const directory = join(cwd, dirname(file));
      const name = packageJson.name || basename(directory);
      return { name, directory, packageJson };
    }),
  );
}

export async function listWorkspaces(
  cwd: string,
): Promise<{ workspaces: WorkspacePackage[]; rootPackageJson: PackageJson }> {
  const rootPackageJson = await readRootPackageJson(cwd);
  const patterns = Array.isArray(rootPackageJson.workspaces)
    ? rootPackageJson.workspaces
    : rootPackageJson.workspaces?.packages;
  return {
    workspaces: await listPackages(cwd, patterns),
    rootPackageJson,
  };
}

export async function hasWorkspacesEnabled(cwd: string): Promise<boolean> {
  const packageJson = await readRootPackageJson(cwd);
  if (!packageJson.private) {
    return false;
  }
  if (Array.isArray(packageJson.workspaces)) {
    return packageJson.workspaces.length > 0;
  }
  if (typeof packageJson.workspaces === 'object') {
    return Boolean(packageJson.workspaces.packages?.length);
  }
  return false;
}

export async function readRootPackageJson(cwd: string): Promise<PackageJson> {
  return await readJsonFile<PackageJson>(join(cwd, 'package.json'));
}

export function hasDependency(packageJson: PackageJson, name: string): boolean {
  const { dependencies = {}, devDependencies = {} } = packageJson;
  return name in devDependencies || name in dependencies;
}

export function hasScript(packageJson: PackageJson, script: string): boolean {
  const { scripts = {} } = packageJson;
  return script in scripts;
}

export function hasCodePushUpDependency(packageJson: PackageJson): boolean {
  return hasDependency(packageJson, '@code-pushup/cli');
}
