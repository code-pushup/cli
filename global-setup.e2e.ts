import { execSync } from 'child_process';
import { setup as globalSetup } from './global-setup';
import { setupTestFolder, teardownTestFolder } from './testing/test-setup/src';
import startLocalRegistry from './tools/scripts/start-local-registry';
import stopLocalRegistry from './tools/scripts/stop-local-registry';

const packages = [
  'cli',
  'nx-plugin',
  'eslint-plugin',
  'coverage-plugin',
  'js-packages-plugin',
  'lighthouse-plugin',
];

export async function setup() {
  await globalSetup();
  const registry = await startLocalRegistry();
  // we can only install packages released by nx, see nx.json release.projects globs
  try {
    packages.forEach(packageName => {
      execSync(
        `npm install -D @code-pushup/${packageName}@e2e --force --registry=${registry}`,
      );
    });
    await setupTestFolder('tmp/e2e');
  } catch (e) {
    stopLocalRegistry();
  }
}

export async function teardown() {
  stopLocalRegistry();
  packages.forEach(packageName => {
    execSync(`npm uninstall @code-pushup/${packageName}`);
  });
  await teardownTestFolder('tmp/e2e');
  await teardownTestFolder('tmp/local-registry');
}
