import { join } from 'node:path';
import { setup as globalSetup } from './global-setup';
import { setupTestFolder, teardownTestFolder } from './testing/test-setup/src';
import {
  nxRunManyNpmInstall,
  nxRunManyNpmUninstall,
} from './tools/src/npm/utils';
import { findLatestVersion, nxRunManyPublish } from './tools/src/publish/utils';
import startLocalRegistry from './tools/src/verdaccio/start-local-registry';
import stopLocalRegistry from './tools/src/verdaccio/stop-local-registry';
import { RegistryResult } from './tools/src/verdaccio/types';

const uniquePort: number = Number(
  (6000 + Number(Math.random() * 1000)).toFixed(0),
);
const e2eDir = join('tmp', 'e2e');
const uniqueDir = join(e2eDir, `registry-${uniquePort}`);

let activeRegistry: RegistryResult;

export async function setup() {
  await globalSetup();
  await setupTestFolder(e2eDir);

  // verdaccio
  try {
    activeRegistry = await startLocalRegistry({
      localRegistryTarget: '@code-pushup/cli-source:local-registry',
      storage: join(uniqueDir, 'storage'),
      port: uniquePort,
    });
  } catch (error) {
    console.info('Error startLocalRegistry: ' + error.message);
    if (typeof error.stop === 'function') {
      activeRegistry = {
        registryData: null,
        stop: () => {},
      };
    } else {
      throw error;
    }
  }

  // package publish & install
  const { registry } = activeRegistry.registryData;
  const version = findLatestVersion();
  nxRunManyPublish({ registry, nextVersion: version });
  nxRunManyNpmInstall({ registry, pkgVersion: version });
}

export async function teardown() {
  if (activeRegistry && 'registryData' in activeRegistry) {
    const { stop } = activeRegistry;

    stopLocalRegistry(stop);
    nxRunManyNpmUninstall();
  } else {
    activeRegistry.stop();
    return;
  }
  await teardownTestFolder(e2eDir);
}
