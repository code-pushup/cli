import { execFileSync, execSync } from 'child_process';
import { join } from 'node:path';
import { setup as globalSetup } from './global-setup';
import { setupTestFolder, teardownTestFolder } from './testing/test-setup/src';
import startLocalRegistry from './tools/scripts/start-local-registry';
import stopLocalRegistry from './tools/scripts/stop-local-registry';

const uniquePort: number = Number(
  (6000 + Number(Math.random() * 1000)).toFixed(0),
);
const e2eDir = join('tmp', 'e2e');
const uniqueDir = join(e2eDir, `registry-${uniquePort}`);
const uniqueLocalRegistryDir = join(uniqueDir, 'local-registry');
const uniqueStorageDir = join(uniqueDir, 'storage');

export async function setup() {
  await globalSetup();
  // general e2e folder
  await setupTestFolder(e2eDir);

  // verdaccio
  try {
    await setupTestFolder(uniqueLocalRegistryDir);
    global.activeRegistry = await startLocalRegistry({
      localRegistryTarget: '@code-pushup/cli-source:local-registry',
      storage: uniqueStorageDir,
      port: uniquePort,
    });

    process.env.registry = global.activeRegistry.registryData;
    const { registry } = global.activeRegistry.registryData;
    console.info(`Installing packages from registry: ${registry}`);
    execFileSync(
      'npx',
      [
        'nx',
        'run-many',
        '--targets=npm-install',
        `--registry=${registry}`,
        '--parallel=1',
      ],
      { env: process.env, stdio: 'inherit', shell: true },
    );
  } catch (error) {
    console.info('setup error: ' + error.message);
  }
}

export async function teardown() {
  console.info(`process.env.registry: ${process.env.registry}`);
  const registry = global.activeRegistry.registryData.registry ?? 'UNDEFINED';
  const stop = global.activeRegistry.stop;
  stopLocalRegistry(stop);
  console.info(`Uninstalling packages from project: ${registry}`);

  execFileSync(
    'npx',
    [
      'nx',
      'run-many',
      '--targets=npm-uninstall',
      `--registry=${registry}`,
      '--parallel=1',
    ],
    { env: process.env, stdio: 'inherit', shell: true },
  );

  await teardownTestFolder(e2eDir);
  await teardownTestFolder(uniqueDir);
}
