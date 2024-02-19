import { teardownTestFolder } from './testing/test-setup/src';

export async function setup() {
  process.env.TZ = 'UTC';
}

export async function teardown() {
  await teardownTestFolder('tmp');
}
