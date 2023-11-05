import { writeFileSync } from 'fs';
import { join } from 'path';
import { ensureDirectoryExists } from '@code-pushup/utils';

export async function setupFolder<T extends object>(
  dirName = 'tmp',
  content?: { [key in keyof T]: string },
) {
  await ensureDirectoryExists(dirName);
  if (content) {
    for (const fileName in content) {
      writeFileSync(join(dirName, fileName), content[fileName]);
    }
  }
}
