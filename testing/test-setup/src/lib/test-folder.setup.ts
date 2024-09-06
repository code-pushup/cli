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
      // eslint-disable-next-line no-magic-numbers
      maxRetries: 3,
      retryDelay: 100,
    });
  } catch (error: unknown) {
    logger.error(
      `⚠️ Failed to delete test artefact ${bold(
        dirName,
      )}\n ️The folder is still in the file system!`,
    );
    logger.error(`Error deleting test folder\n${JSON.stringify(error)}`);
  }
}
