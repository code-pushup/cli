import { execFileSync, execSync } from 'child_process';
import { setup as globalSetup } from './global-setup';
import { setupTestFolder, teardownTestFolder } from './testing/test-setup/src';
import startLocalRegistry from './tools/scripts/start-local-registry';
import stopLocalRegistry from './tools/scripts/stop-local-registry';
import { findLatestVersion } from './tools/scripts/utils';

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
    /*
    execSync('npm install -D @code-pushup/cli@e2e');
    execSync('npm install -D @code-pushup/nx-plugin@e2e');
    execSync('npm install -D @code-pushup/eslint-plugin@e2e');
    execSync('npm install -D @code-pushup/coverage-plugin@e2e');
     */
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
  /*
  execSync('npm uninstall @code-pushup/cli');
  execSync('npm uninstall @code-pushup/nx-plugin');
  execSync('npm uninstall @code-pushup/eslint-plugin');
  execSync('npm uninstall @code-pushup/coverage-plugin');
   */
  await teardownTestFolder('tmp/e2e');
  await teardownTestFolder('tmp/local-registry');
}
