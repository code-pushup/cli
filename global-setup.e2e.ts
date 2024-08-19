import { execFileSync, execSync } from 'child_process';
import { setup as globalSetup } from './global-setup';
import { setupTestFolder, teardownTestFolder } from './testing/test-setup/src';
import startLocalRegistry from './tools/scripts/start-local-registry';
import stopLocalRegistry from './tools/scripts/stop-local-registry';

const localRegistryNxTarget = '@code-pushup/cli-source:local-registry';

export async function setup() {
  await globalSetup();
  await setupTestFolder('tmp/local-registry');
  await setupTestFolder('tmp/e2e');

  try {
    await startLocalRegistry({ localRegistryTarget: localRegistryNxTarget });
  } catch (error) {
    console.error('Error starting local verdaccio registry:\n' + error.message);
    throw error;
  }

  try {
    console.info('Installing packages');
    execFileSync(
      'npx',
      ['nx', 'run-many', '--targets=npm-install', '--parallel=1'],
      { env: process.env, stdio: 'inherit', shell: true },
    );
  } catch (error) {
    console.error('Error installing packages:\n' + error.message);
    throw error;
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
