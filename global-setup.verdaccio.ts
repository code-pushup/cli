import { bold, red } from 'ansis';
import { setup as globalSetup } from './global-setup';
import { nxRunManyNpmInstall } from './tools/src/npm/utils';
import { findLatestVersion, nxRunManyPublish } from './tools/src/publish/utils';
import {
  VerdaccioEnvResult,
  nxStopVerdaccioAndTeardownEnv,
  startVerdaccioAndSetupEnv,
} from './tools/src/verdaccio/env';

let activeRegistry: VerdaccioEnvResult;
const projectName = process.env['NX_TASK_TARGET_PROJECT'];

export async function setup() {
  await globalSetup();

  try {
    activeRegistry = await startVerdaccioAndSetupEnv({
      projectName,
      verbose: true,
    });
  } catch (error) {
    console.error('Error starting local verdaccio registry:\n' + error.message);
    throw error;
  }

  const { workspaceRoot, registry } = activeRegistry;
  const { url } = registry;
  console.info(`Publish packages to registry: ${url}.`);
  try {
    execFileSync(
      'npx',
      [
        'nx',
        'publish-deps',
        projectName,
        ...objectToCliArgs({
          prefix: workspaceRoot,
          registry: url,
          parallel: 1,
        }),
      ],
      { env: process.env, stdio: 'inherit', shell: true },
    );
  } catch (error) {
    console.error('Error publishing packages:\n' + error.message);
    throw error;
  }
  console.info(`Install packages to registry: ${url}.`);
  try {
    execFileSync(
      'npx',
      [
        'nx',
        'install-deps',
        projectName,
        ...objectToCliArgs({
          prefix: workspaceRoot,
          registry: url,
          parallel: 1,
        }),
      ],
      { env: process.env, stdio: 'inherit', shell: true },
    );
  } catch (error) {
    console.error('Error installing packages:\n' + error.message);
    throw error;
  }
}

export async function teardown() {
  // potentially just skip as folder are deleted next line
  // nxRunManyNpmUninstall({ userconfig, prefix: activeRegistry.workspaceRoot, parallel: 1 });

  // comment out to see the folder and web interface
  await nxStopVerdaccioAndTeardownEnv(activeRegistry);
}
