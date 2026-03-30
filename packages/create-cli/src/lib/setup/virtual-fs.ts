import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileExists } from '@code-pushup/utils';
import type { FileChange, FileSystemAdapter, Tree } from './types.js';

const DEFAULT_FS: FileSystemAdapter = {
  readFile,
  writeFile,
  exists: fileExists,
  mkdir,
};

export function createTree(
  root: string,
  fs: FileSystemAdapter = DEFAULT_FS,
): Tree {
  const pending = new Map<FileChange['path'], Omit<FileChange, 'path'>>();

  const resolve = (filePath: string): string => path.resolve(root, filePath);

  return {
    root,

    exists: async (filePath: string): Promise<boolean> =>
      pending.has(filePath) || fs.exists(resolve(filePath)),

    read: async (filePath: string): Promise<string | null> => {
      const entry = pending.get(filePath);
      if (entry) {
        return entry.content;
      }
      const absolutePath = resolve(filePath);
      if (!(await fs.exists(absolutePath))) {
        return null;
      }
      return fs.readFile(absolutePath, 'utf8');
    },

    write: async (filePath: string, content: string): Promise<void> => {
      const entry = pending.get(filePath);
      if (entry) {
        pending.set(filePath, { ...entry, content });
      } else {
        const type = (await fs.exists(resolve(filePath))) ? 'UPDATE' : 'CREATE';
        pending.set(filePath, { content, type });
      }
    },

    listChanges: (): FileChange[] =>
      [...pending.entries()].map(([filePath, { content, type }]) => ({
        path: filePath,
        type,
        content,
      })),

    async flush(): Promise<void> {
      await Promise.all(
        [...pending.entries()].map(async ([filePath, { content }]) => {
          const absolutePath = resolve(filePath);
          await fs.mkdir(path.dirname(absolutePath), { recursive: true });
          await fs.writeFile(absolutePath, content);
        }),
      );
      pending.clear();
    },
  };
}
