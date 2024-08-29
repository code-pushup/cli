import { logger } from '@nx/devkit';
import { bold } from 'ansis';
import { mkdir, rm } from 'node:fs/promises';

export async function setupTestFolder(dirName: string) {
  await mkdir(dirName, { recursive: true });
}

export async function cleanTestFolder(dirName: string) {
  await rm(dirName, { recursive: true, force: true });
  await mkdir(dirName, { recursive: true });
}

export async function teardownTestFolder(dirName: string) {
  try {
    await rm(dirName, { recursive: true, force: true, maxRetries: 2 });
  } catch (error) {
    logger.error(`Failed to delete test artefact ${bold(dirName)} :(.`);
    throw error;
  }
}
