import { execFileSync } from 'node:child_process';
import { objectToCliArgs } from '../../../packages/utils/src';

export type NpmInstallOptions = {
  directory?: string;
  prefix?: string;
  registry?: string;
  userconfig?: string;
  tag?: string;
  pkgVersion?: string;
  parallel?: number;
};

export function nxRunManyNpmInstall({
  registry,
  prefix,
  userconfig,
  tag = 'e2e',
  pkgVersion,
  directory,
  parallel,
}: NpmInstallOptions) {
  console.info(
    `Installing packages in ${directory} from registry: ${registry}.`,
  );
  try {
    execFileSync(
      'nx',
      [
        ...objectToCliArgs({
          _: ['run-many'],
          targets: 'npm-install',
          ...(parallel ? { parallel } : {}),
          ...(pkgVersion ? { pkgVersion } : {}),
          ...(tag ? { tag } : {}),
          ...(registry ? { registry } : {}),
          ...(userconfig ? { userconfig } : {}),
          ...(prefix ? { prefix } : {}),
        }),
      ],
      {
        env: process.env,
        stdio: 'inherit',
        shell: true,
        cwd: directory ?? process.cwd(),
      },
    );
  } catch (error) {
    console.error('Error installing packages:\n' + error.message);
    throw error;
  }
}

export function nxRunManyNpmUninstall({
  parallel,
  ...opt
}: {
  prefix: string;
  userconfig: string;
  parallel: number;
}) {
  console.info('Uninstalling all NPM packages.');
  try {
    execFileSync(
      'npx',
      objectToCliArgs({
        _: ['nx', 'run-many'],
        targets: 'npm-uninstall',
        parallel,
        ...opt,
      }),
      { env: process.env, stdio: 'inherit', shell: true },
    );
  } catch (error) {
    console.error('Uninstalling all NPM packages failed.');
  }
}
