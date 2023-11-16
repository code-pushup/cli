import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ensureDirectoryExists } from '@code-pushup/utils';

// @TODO move into testing library
export function cleanFolder<T extends object>(
  dirName = 'tmp/cli-e2e',
  content?: { [key in keyof T]: string },
) {
  rmSync(dirName, { recursive: true, force: true });
  mkdirSync(dirName);
  if (content) {
    for (const fileName in content) {
      writeFileSync(join(dirName, fileName), content[fileName]);
    }
  }
}
// @TODO move into testing library
export function cleanFolderPutGitKeep<T extends object>(
  dirName = 'tmp/cli-e2e',
  content?: { [key in keyof T]: string },
) {
  rmSync(dirName, { recursive: true, force: true });
  mkdirSync(dirName);
  writeFileSync(join(dirName, '.gitkeep'), '');
  if (content) {
    for (const fileName in content) {
      writeFileSync(join(dirName, fileName), content[fileName]);
    }
  }
}

export function setupFolder(
  dirName = 'tmp/cli-e2e',
  content?: Record<string, string>,
) {
  ensureDirectoryExists(dirName);
  if (content) {
    for (const fileName in content) {
      writeFileSync(join(dirName, fileName), content[fileName]);
    }
  }
}
