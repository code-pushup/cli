import { join } from 'node:path';
import { fileExists } from '@code-pushup/utils';
import { PackageManagerId } from './config';
import { DEFAULT_PACKAGE_MANAGER } from './constants';

export async function derivePackageManager(
  currentDir = process.cwd(),
): Promise<PackageManagerId> {
  // Check for lock files
  if (await fileExists(join(currentDir, 'package-lock.json'))) {
    return 'npm';
  } else if (await fileExists(join(currentDir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  } else if (await fileExists(join(currentDir, 'yarn.lock'))) {
    if (await fileExists(join(currentDir, '.yarnrc.yml'))) {
      return 'yarn-modern';
    }
    return 'yarn-classic';
  }
  return DEFAULT_PACKAGE_MANAGER;
}
