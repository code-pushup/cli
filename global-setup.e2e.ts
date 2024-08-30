import { join } from 'node:path';
import { setup as globalSetup } from './global-setup';
import { setupTestFolder, teardownTestFolder } from './testing/test-setup/src';
import {
  nxRunManyNpmInstall,
  nxRunManyNpmUninstall,
} from './tools/src/npm/utils';
import { findLatestVersion, nxRunManyPublish } from './tools/src/publish/utils';
import { START_VERDACCIO_SERVER_TARGET_NAME } from './tools/src/verdaccio/constants';
import startLocalRegistry, {
  RegistryResult,
} from './tools/src/verdaccio/start-local-registry';
import stopLocalRegistry from './tools/src/verdaccio/stop-local-registry';
import { uniquePort } from './tools/src/verdaccio/utils';

const e2eDir = join('tmp', 'e2e', 'react-todos-app')
const uniqueDir = join(e2eDir, `registry-${uniquePort()}`);

let activeRegistry: RegistryResult;

export async function setup() {
  await globalSetup();
  await setupTestFolder(e2eDir);

  try {
    activeRegistry = await startLocalRegistry({
      localRegistryTarget: `@code-pushup/cli-source:${START_VERDACCIO_SERVER_TARGET_NAME}`,
      storage: join(uniqueDir, 'storage'),
      port: uniquePort(),
    });
  } catch (error) {
    console.error('Error starting local verdaccio registry:\n' + error.message);
    throw error;
  }

  // package publish
  const { registry } = activeRegistry.registryData;
  try {
    console.info('Publish packages');
    nxRunManyPublish({
      registry,
      nextVersion: findLatestVersion(),
      parallel: 1,
    });
  } catch (error) {
    console.error('Error publishing packages:\n' + error.message);
    throw error;
  }

  // package install
  try {
    console.info('Installing packages');
    nxRunManyNpmInstall({ registry, parallel: 1 });
  } catch (error) {
    console.error('Error installing packages:\n' + error.message);
    throw error;
  }
}

export async function teardown() {
  if (activeRegistry && 'registryData' in activeRegistry) {
    const { stop } = activeRegistry;

    stopLocalRegistry(stop);
    nxRunManyNpmUninstall({ parallel: 1 });
  }
  await teardownTestFolder(e2eDir);
}
