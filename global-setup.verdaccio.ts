import { setup as globalSetup } from './global-setup';
import {
  nxRunManyNpmInstall,
  nxRunManyNpmUninstall,
} from './tools/src/npm/utils';
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
      projectName: process.env['NX_TASK_TARGET_TARGET'],
    });
  } catch (error) {
    console.error('Error starting local verdaccio registry:\n' + error.message);
    throw error;
  }

  // package publish
  const { registry, workspaceRoot } = activeRegistry;
  const { url } = registry;
  try {
    console.info('Publish packages');
    nxRunManyPublish({ nextVersion: findLatestVersion() });
  } catch (error) {
    console.error('Error publishing packages:\n' + error.message);
    throw error;
  }

  // package install
  try {
    console.info('Installing packages');
    nxRunManyNpmInstall({ directory: workspaceRoot });
  } catch (error) {
    console.error('Error installing packages:\n' + error.message);
    throw error;
  }
}

export async function teardown() {
  nxRunManyNpmUninstall(); // potentially just skip as folder are deleted next line
  nxStopVerdaccioAndTeardownEnv(activeRegistry);
}
