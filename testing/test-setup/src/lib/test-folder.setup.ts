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
    await rm(dirName, {
      recursive: true,
      force: true,
      maxRetries: 2,
      retryDelay: 100,
    });
  } catch (error: unknown) {
    logger.warn(
      `⚠️ Failed to delete test artefact ${bold(
        dirName,
      )} so the folder is still in the file system!\nIt may require a deletion before running e2e tests again.`,
    );
  }
}
