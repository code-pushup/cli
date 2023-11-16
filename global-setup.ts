import { mkdir, rm } from 'fs/promises';
import startLocalRegistry from './tools/scripts/start-local-registry';
import stopLocalRegistry from './tools/scripts/stop-local-registry';

export async function setup() {
  // ensure clean tmp/ directory
  await rm('tmp', { recursive: true, force: true });
  await mkdir('tmp', { recursive: true });
  process.env.TZ = 'UTC';
}
