import { execFileSync, execSync } from 'node:child_process';
import { objectToCliArgs } from '../../../packages/utils/src';
import { removeColorCodes } from '../../../testing/test-utils/src';
import { NPM_CHECK_SCRIPT } from './constants';
import { NpmCheckToken } from './types';

// @TODO The function is returning a strange string not matching the one in the function :)
export function npmCheck({
  pkgRange,
  registry,
  cwd,
}: {
  pkgRange: string;
  registry: string;
  cwd?: string;
}): string | undefined {
  const [foundPackage, token] = execSync(
    `tsx ${NPM_CHECK_SCRIPT} ${objectToCliArgs({
      pkgRange,
      registry,
    }).join(' ')}`,
    { cwd },
  )
    .toString()
    .trim()
    .split('#') as [string, NpmCheckToken];
  const cleanToken = token.trim();

  if (cleanToken === 'FOUND') {
    return cleanToken;
  } else if (cleanToken === 'NOT_FOUND') {
    return;
  } else {
    throw new Error(
      `NPM check script returned invalid token ${cleanToken} for package ${foundPackage}`,
    );
  }
}

// @TODO The function is returning a strange string not matching the one in the function :)
export function nxNpmCheck({
  projectName,
  registry,
  cwd,
  pkgVersion,
}: {
  projectName?: string;
  pkgVersion?: string;
  registry?: string;
  cwd?: string;
}) {
  const [foundPackage, token] = execSync(
    `nx npm-check ${projectName} ${objectToCliArgs({
      pkgVersion,
      registry,
    }).join(' ')}`,
    { cwd },
  )
    .toString()
    .trim()
    .split('#') as [string, NpmCheckToken];
  const cleanToken = removeColorCodes(token);

  return cleanToken;

  if (cleanToken === 'FOUND') {
    return token;
  } else if (cleanToken === 'NOT_FOUND') {
    return token;
  } else {
    throw new Error(
      `Nx NPM check script returned invalid token ${cleanToken} for package ${foundPackage}`,
    );
  }
}

export type NpmInstallOptions = {
  directory?: string;
  registry?: string;
  tag?: string;
  pkgVersion?: string;
};

export function nxRunManyNpmInstall({
  registry,
  tag = 'e2e',
  pkgVersion,
  directory,
}: NpmInstallOptions) {
  console.info(`Installing packages from registry: ${registry}.`);

  execFileSync(
    'npx',
    [
      ...objectToCliArgs({
        _: ['nx', 'run-many'],
        targets: 'npm-install',
        parallel: 1,
        ...(pkgVersion ? { pkgVersion } : {}),
        ...(tag ? { tag } : {}),
        ...(registry ? { registry } : {}),
      }),
    ],
    {
      env: process.env,
      stdio: 'inherit',
      shell: true,
      cwd: directory ?? process.cwd(),
    },
  );
}

export function nxRunManyNpmUninstall() {
  console.info('Uninstalling all NPM packages.');
  try {
    execFileSync(
      'npx',
      objectToCliArgs({
        _: ['nx', 'run-many'],
        targets: 'npm-uninstall',
        parallel: 1,
      }),
      { env: process.env, stdio: 'inherit', shell: true },
    );
  } catch (error) {
    console.error('Uninstalling all NPM packages failed.');
  }
}
