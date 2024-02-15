import { mkdir, rm } from 'node:fs/promises';

export async function setupTestFolder(dirName: string) {
  await mkdir(dirName, { recursive: true });
}

export async function cleanTestFolder(dirName: string) {
  await rm(dirName, { recursive: true, force: true });
  await mkdir(dirName, { recursive: true });
}

export async function teardownTestFolder(dirName: string) {
  await rm(dirName, { recursive: true, force: true });
}
