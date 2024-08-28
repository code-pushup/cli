import { bold, red } from 'ansis';
import { setup as globalSetup } from './global-setup';
import { nxRunManyNpmInstall } from './tools/src/npm/utils';
import { findLatestVersion, nxRunManyPublish } from './tools/src/publish/utils';
import {
  VerdaccioEnvResult,
  nxStartVerdaccioAndSetupEnv,
  nxStopVerdaccioAndTeardownEnv,
} from './tools/src/verdaccio/env';

let activeRegistry: VerdaccioEnvResult;

export async function setup() {
  await globalSetup();

  try {
    activeRegistry = await nxStartVerdaccioAndSetupEnv({
      projectName: process.env['NX_TASK_TARGET_PROJECT'],
      verbose: true,
    });
  } catch (error) {
    console.error('Error starting local verdaccio registry:\n' + error.message);
    throw error;
  }

  const { userconfig, workspaceRoot } = activeRegistry;
  nxRunManyPublish({
    registry: activeRegistry.registry.url,
    nextVersion: findLatestVersion(),
    userconfig,
    parallel: 1,
  });
  nxRunManyNpmInstall({ prefix: workspaceRoot, userconfig, parallel: 1 });
}

export async function teardown() {
  // potentially just skip as folder are deleted next line
  // nxRunManyNpmUninstall({ userconfig, prefix: activeRegistry.workspaceRoot, parallel: 1 });
  // comment out to see the folder and web interface
  //await nxStopVerdaccioAndTeardownEnv(activeRegistry);
}
