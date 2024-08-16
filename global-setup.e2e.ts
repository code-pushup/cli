import { execSync } from 'child_process';
import { setup as globalSetup } from './global-setup';
import { setupTestFolder, teardownTestFolder } from './testing/test-setup/src';
import startLocalRegistry from './tools/scripts/start-local-registry';
import stopLocalRegistry from './tools/scripts/stop-local-registry';

export async function setup() {
  await globalSetup();
  await startLocalRegistry();
  execSync('npm install -D @code-pushup/cli@e2e');
  execSync('npm install -D @code-pushup/create-cli@e2e');
  execSync('npm install -D @code-pushup/nx-plugin@e2e');
  execSync('npm install -D @code-pushup/eslint-plugin@e2e');
  execSync('npm install -D @code-pushup/coverage-plugin@e2e');
  await setupTestFolder('tmp/e2e');
}

export async function teardown() {
  stopLocalRegistry();
  execSync('npm uninstall @code-pushup/cli');
  execSync('npm uninstall @code-pushup/create-cli');
  execSync('npm uninstall @code-pushup/nx-plugin');
  execSync('npm uninstall @code-pushup/eslint-plugin');
  execSync('npm uninstall @code-pushup/coverage-plugin');
  await teardownTestFolder('tmp/local-registry');
}
