import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileExists } from '@code-pushup/utils';
import type { PackageManagerId } from '../config';
import { deriveYarnVersion } from './derive-yarn';

export async function derivePackageManagerInPackageJson(
  currentDir = process.cwd(),
) {
  if (await fileExists(join(currentDir, 'package.json'))) {
    const content = JSON.parse(
      (await readFile(join('package.json'))).toString(),
    ) as { packageManager?: string };
    const { packageManager: packageManagerData = '' } = content;

    const [manager = '', version = ''] = packageManagerData.split('@');

    if (manager === 'npm') {
      return manager;
    }
    if (manager === 'pnpm') {
      return manager;
    }
    if (manager === 'yarn') {
      const majorVersion = Number(version.split('.')[0]);
      return majorVersion > 1 ? 'yarn-modern' : 'yarn-classic';
    }
  }
  return false;
}

export async function derivePackageManager(
  currentDir = process.cwd(),
): Promise<PackageManagerId> {
  const pkgManagerFromPackageJson = await derivePackageManagerInPackageJson(
    currentDir,
  );
  if (pkgManagerFromPackageJson) {
    return pkgManagerFromPackageJson;
  }

  // Check for lock files
  if (await fileExists(join(currentDir, 'package-lock.json'))) {
    return 'npm';
  } else if (await fileExists(join(currentDir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  } else if (await fileExists(join(currentDir, 'yarn.lock'))) {
    const yarnVersion = await deriveYarnVersion();
    if (yarnVersion) {
      return yarnVersion;
    }
  }

  throw new Error(
    'Could not detect package manager. Please provide it in the js-packages plugin config.',
  );
}
