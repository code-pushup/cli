import { ExecException } from 'child_process';
import { exec } from 'node:child_process';
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
    const yarnVersion = await new Promise<string>((resolve, reject) => {
      const { stdout } = exec(
        'yarn -v',
        (error: ExecException | null, stdout: string, stderr: string) => {
          if (error) {
            reject(error);
          }
          if (stderr) {
            reject(stderr);
          }

          resolve(stdout?.toString().trim().at(0) ?? '');
        },
      );
    });

    if (yarnVersion === '2' || yarnVersion === '3') {
      return 'yarn-modern';
    }
    return 'yarn-classic';
  }
  return DEFAULT_PACKAGE_MANAGER;
}
