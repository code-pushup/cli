import { Tree } from '@nx/devkit';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { ensureDirectoryExists } from '@code-pushup/test-utils';

export async function materializeTree(tree: Tree, targetFolder: string) {
  const changes = tree.listChanges();
  await Promise.all(
    changes.map(change => {
      const filePath = join(targetFolder, change.path);
      if (change.type === 'CREATE' || change.type === 'UPDATE') {
        return ensureDirectoryExists(dirname(filePath)).then(() =>
          writeFile(filePath, change.content?.toString() ?? ''),
        );
      }
      return Promise.resolve();
    }),
  );
}
