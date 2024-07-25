import { ExecException, exec } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileExists } from '@code-pushup/utils';
import {
  JSPackagesPluginConfig,
  PackageManagerId,
  jsPackagesPluginConfigSchema,
} from './config';
import { packageManagers } from './package-managers';

export async function normalizeConfig(config?: JSPackagesPluginConfig) {
  const jsPackagesPluginConfig = jsPackagesPluginConfigSchema.parse(
    config ?? {},
  );

  const {
    packageManager,
    dependencyGroups: dependencyGroupsCfg = [],
    checks: checksCfg = [],
    ...jsPackagesPluginConfigRest
  } = jsPackagesPluginConfig;
  const checks = [...new Set(checksCfg)];
  const depGroups = [...new Set(dependencyGroupsCfg)];
  const pm = packageManagers[packageManager ?? (await derivePackageManager())];

  return {
    ...jsPackagesPluginConfigRest,
    packageManager: pm,
    checks,
    depGroups,
  };
}

export async function deriveYarnVersion() {
  const yarnVersion = await new Promise<string>((resolve, reject) => {
    exec(
      'yarn -v',
      (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          reject(error);
        }
        if (stderr) {
          reject(stderr);
        }

        resolve(stdout.toString().trim().at(0) ?? '');
      },
    );
  });

  if (yarnVersion === '2' || yarnVersion === '3') {
    return 'yarn-modern';
  } else if (yarnVersion === '1') {
    return 'yarn-classic';
  }
  return false;
}

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
    'Could not detect package manager. Please provide in in the js-packages plugin config.',
  );
}
