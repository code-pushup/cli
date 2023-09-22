import { mkdir, rm } from 'fs/promises';

export async function setup() {
  await mkdir('tmp', { recursive: true });
}

export async function teardown() {
  await rm('tmp', { recursive: true, force: true });
}
