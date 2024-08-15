import { setupTestFolder } from './testing/test-setup/src';

export async function setup() {
  process.env.TZ = 'UTC';
}
