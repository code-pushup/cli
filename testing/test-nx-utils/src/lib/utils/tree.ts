import type { Tree } from '@nx/devkit';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureDirectoryExists } from '@code-pushup/test-utils';

export async function materializeTree(tree: Tree, targetFolder: string) {
  const changes = tree.listChanges();
  await Promise.all(
    changes.map(async change => {
      // Handle absolute paths that start with '/' by making them relative
      const relativePath = change.path.startsWith('/')
        ? change.path.slice(1)
        : change.path;
      const filePath = path.join(targetFolder, relativePath);

      if (change.type === 'CREATE' || change.type === 'UPDATE') {
        try {
          await ensureDirectoryExists(path.dirname(filePath));
          await writeFile(filePath, change.content?.toString() ?? '');
        } catch (error) {
          console.error(`Failed to process file ${filePath}:`, error);
        }
      }
    }),
  );
}
