import { mkdir, rm } from 'fs/promises';

export async function setup() {
  // ensure clean tmp/ directory
  // await rm('tmp', { recursive: true, force: true });
  // await mkdir('tmp', { recursive: true });
}
