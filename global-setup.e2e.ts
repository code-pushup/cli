import { execFileSync, execSync } from 'child_process';
import { setup as globalSetup } from './global-setup';
import { setupTestFolder, teardownTestFolder } from './testing/test-setup/src';
import startLocalRegistry from './tools/scripts/start-local-registry';
import stopLocalRegistry from './tools/scripts/stop-local-registry';

const localRegistryNxTarget = '@code-pushup/cli-source:local-registry';

export async function setup() {
  await globalSetup();
  try {
    await setupTestFolder('tmp/local-registry');
    await startLocalRegistry({ localRegistryTarget: localRegistryNxTarget });
    console.info('Installing packages');
    execFileSync(
      'npx',
      ['nx', 'run-many', '--targets=npm-install', '--parallel=1'],
      { env: process.env, stdio: 'inherit', shell: true },
    );
    await setupTestFolder('tmp/e2e');
  } catch (error) {
    console.info('setup error: ' + error.message);
  }
}

export async function teardown() {
  stopLocalRegistry();
  console.info('Uninstalling packages');
  execFileSync(
    'npx',
    ['nx', 'run-many', '--targets=npm-uninstall', '--parallel=1'],
    { env: process.env, stdio: 'inherit', shell: true },
  );
  await teardownTestFolder('tmp/e2e');
  await teardownTestFolder('tmp/local-registry');
}
