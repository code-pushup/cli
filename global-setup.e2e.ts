import { execSync } from 'child_process';
import { setup as globalSetup } from './global-setup';
import { setupTestFolder, teardownTestFolder } from './testing/test-setup/src';
import startLocalRegistry from './tools/scripts/start-local-registry';
import stopLocalRegistry from './tools/scripts/stop-local-registry';

export async function setup() {
  await globalSetup();
  const registry = await startLocalRegistry();
  try {
    execSync(`npm install -D @code-pushup/cli@e2e --registry=${registry}`);
    execSync(
      `npm install -D @code-pushup/eslint-plugin@e2e --registry=${registry}`,
    );
    execSync(
      `npm install -D @code-pushup/coverage-plugin@e2e --registry=${registry}`,
    );
    await setupTestFolder('tmp/e2e');
  } catch (e) {
    stopLocalRegistry();
  }
}

export async function teardown() {
  stopLocalRegistry();
  execSync('npm uninstall @code-pushup/cli');
  execSync('npm uninstall @code-pushup/eslint-plugin');
  execSync('npm uninstall @code-pushup/coverage-plugin');
  await teardownTestFolder('tmp/e2e');
  await teardownTestFolder('tmp/local-registry');
}
