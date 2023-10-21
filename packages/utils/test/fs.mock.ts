import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

export function cleanFolder<T extends object>(
  dirName = 'tmp',
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

export function cleanFolderPutGitKeep<T extends object>(
  dirName = 'tmp',
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
