import { execFileSync } from 'node:child_process';
import { objectToCliArgs } from '../../../packages/utils/src';

export type NpmInstallOptions = {
  directory?: string;
  prefix?: string;
  registry?: string;
  userconfig?: string;
  tag?: string;
  pkgVersion?: string;
};

export function nxRunManyNpmInstall({
  registry,
  prefix,
  userconfig,
  tag = 'e2e',
  pkgVersion,
  directory,
}: NpmInstallOptions) {
  console.info(
    `Installing packages in ${directory} from registry: ${registry}.`,
  );

  execFileSync(
    'nx',
    [
      ...objectToCliArgs({
        _: ['run-many'],
        targets: 'npm-install',
        parallel: 1,
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
}

export function nxRunManyNpmUninstall(opt: {
  prefix: string;
  userconfig: string;
}) {
  console.info('Uninstalling all NPM packages.');
  try {
    execFileSync(
      'npx',
      objectToCliArgs({
        _: ['nx', 'run-many'],
        targets: 'npm-uninstall',
        parallel: 1,
        ...opt,
      }),
      { env: process.env, stdio: 'inherit', shell: true },
    );
  } catch (error) {
    console.error('Uninstalling all NPM packages failed.');
  }
}
