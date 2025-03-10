import { logger } from '@nx/devkit';
import { bold } from 'ansis';
import { mkdir, rm, stat } from 'node:fs/promises';

export async function cleanTestFolder(dirName: string) {
  await teardownTestFolder(dirName);
  await mkdir(dirName, { recursive: true });
}

export async function teardownTestFolder(dirName: string) {
  try {
    const stats = await stat(dirName);
    if (!stats.isDirectory()) {
      logger.warn(
        `⚠️ You are trying to delete a file instead of a directory - ${bold(
          dirName,
        )}.`,
      );
    }
  } catch {
    // continue safely without deleting as folder does not exist in the filesystem
    return;
  }

  try {
    await rm(dirName, {
      recursive: true,
      force: true,
      maxRetries: 2,
      retryDelay: 100,
    });
  } catch {
    logger.warn(
      `⚠️ Failed to delete test artefact ${bold(
        dirName,
      )} so the folder is still in the file system!\nIt may require a deletion before running e2e tests again.`,
    );
  }
}
