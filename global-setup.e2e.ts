import { setup as globalSetup } from './global-setup';
import startLocalRegistry from './tools/scripts/start-local-registry';
import stopLocalRegistry from './tools/scripts/stop-local-registry';

export async function setup() {
  await globalSetup();

  await startLocalRegistry();
}

export async function teardown() {
  stopLocalRegistry();
}
