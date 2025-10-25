import { mkdir } from 'node:fs/promises';

export async function ensureDirectoryExists(baseDir: string) {
  try {
    await mkdir(baseDir, { recursive: true });
    return;
  } catch (error) {
    const fsError = error as NodeJS.ErrnoException;
    console.error(fsError.message);
    if (fsError.code !== 'EEXIST') {
      throw error;
    }
  }
}
