import { bold } from 'ansis';
import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';

export async function cleanTestFolder(dirName: string) {
  await teardownTestFolder(dirName);
  await mkdir(dirName, { recursive: true });
}

export async function teardownTestFolder(dirName: string) {
  try {
    const stats = await stat(dirName);
    if (!stats.isDirectory()) {
      console.warn(
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
    console.warn(
      `⚠️ Failed to delete test artefact ${bold(
        dirName,
      )} so the folder is still in the file system!\nIt may require a deletion before running e2e tests again.`,
    );
  }
}

/**
 * File names that need to be restored by removing the "_" prefix.
 * These files are prefixed with "_" in mock fixtures to avoid Nx detection.
 */
export const NX_IGNORED_FILES_TO_RESTORE = [
  '_package.json',
  '_nx.json',
  '_project.json',
] as const;

/**
 * Recursively renames specific files by removing the "_" prefix.
 * This is needed because mock fixtures have "_" prefix to avoid Nx detection,
 * but tests need the original filenames.
 *
 * @param dir - Directory to process recursively
 * @param fileNames - Array of file names to restore (e.g., ['_package.json', '_nx.json', '_project.json'])
 */
export async function restoreRenamedFiles(
  dir: string,
  fileNames: readonly string[],
): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await restoreRenamedFiles(fullPath, fileNames);
      } else if (entry.isFile() && fileNames.includes(entry.name)) {
        const newName = entry.name.slice(1); // Remove leading "_"
        const newPath = path.join(dir, newName);
        try {
          await rename(fullPath, newPath);
        } catch (error) {
          // Ignore errors if file doesn't exist or can't be renamed
        }
      }
    }
  } catch (error) {
    // Ignore errors if directory doesn't exist
  }
}
