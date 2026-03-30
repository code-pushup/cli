import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileExists, logger } from '@code-pushup/utils';
import type { PackageManagerId } from '../config.js';
import { formatMetaLog } from '../format.js';
import { deriveYarnVersion } from './derive-yarn.js';
import { packageManagers } from './package-managers.js';

export async function derivePackageManagerInPackageJson(
  currentDir = process.cwd(),
) {
  if (await fileExists(path.join(currentDir, 'package.json'))) {
    const content = JSON.parse(
      (await readFile(path.join('package.json'))).toString(),
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

type DetectionResult = {
  id: PackageManagerId;
  sourceDescription: string;
};

async function resolvePackageManager(
  currentDir: string,
): Promise<DetectionResult> {
  const pkgManagerFromPackageJson =
    await derivePackageManagerInPackageJson(currentDir);
  if (pkgManagerFromPackageJson) {
    return {
      id: pkgManagerFromPackageJson,
      sourceDescription: 'packageManager field in package.json',
    };
  }

  // Check for lock files
  if (await fileExists(path.join(currentDir, 'package-lock.json'))) {
    return {
      id: 'npm',
      sourceDescription: 'existence of package-lock.json file',
    };
  } else if (await fileExists(path.join(currentDir, 'pnpm-lock.yaml'))) {
    return {
      id: 'pnpm',
      sourceDescription: 'existence of pnpm-lock.yaml file',
    };
  } else if (await fileExists(path.join(currentDir, 'yarn.lock'))) {
    const yarnVersion = await deriveYarnVersion();
    if (yarnVersion) {
      return {
        id: yarnVersion,
        sourceDescription: 'existence of yarn.lock file and yarn -v command',
      };
    }
  }

  throw new Error(
    'Could not detect package manager. Please provide it in the js-packages plugin config.',
  );
}

export async function detectPackageManager(
  currentDir = process.cwd(),
): Promise<PackageManagerId> {
  const { id } = await resolvePackageManager(currentDir);
  return id;
}

export async function derivePackageManager(
  currentDir = process.cwd(),
): Promise<PackageManagerId> {
  const { id, sourceDescription } = await resolvePackageManager(currentDir);
  const pm = packageManagers[id];
  logger.info(
    formatMetaLog(
      `Inferred ${pm.name} package manager from ${sourceDescription}`,
    ),
  );
  return id;
}
