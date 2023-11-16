import { execSync } from 'child_process';
import { setup as globalSetup } from './global-setup';
import startLocalRegistry from './tools/scripts/start-local-registry';
import stopLocalRegistry from './tools/scripts/stop-local-registry';

export async function setup() {
  await globalSetup();

  await startLocalRegistry();

  execSync('npm install -g @code-pushup/cli@e2e');
}

export async function teardown() {
  stopLocalRegistry();

  execSync('npm uninstall -g @code-pushup/cli');
}
