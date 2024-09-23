import type { Tree } from '@nx/devkit';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { ensureDirectoryExists } from '@code-pushup/test-utils';

export async function materializeTree(tree: Tree, targetFolder: string) {
  const changes = tree.listChanges();
  await Promise.all(
    changes.map(async change => {
      const filePath = join(targetFolder, change.path);

      if (change.type === 'CREATE' || change.type === 'UPDATE') {
        try {
          await ensureDirectoryExists(dirname(filePath));
          await writeFile(filePath, change.content?.toString() ?? '');
        } catch (error) {
          console.error(`Failed to process file ${filePath}:`, error);
        }
      }
    }),
  );
}
