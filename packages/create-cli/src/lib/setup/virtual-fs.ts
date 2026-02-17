/* eslint-disable n/no-sync */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { FileChange, FileSystemAdapter, Tree } from './types.js';

const DEFAULT_FS: FileSystemAdapter = {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
};

export function createTree(
  root: string,
  fs: FileSystemAdapter = DEFAULT_FS,
): Tree {
  const pending = new Map<
    string,
    { content: string; type: 'CREATE' | 'UPDATE' }
  >();

  const resolve = (filePath: string): string => path.resolve(root, filePath);

  return {
    root,

    exists: (filePath: string): boolean =>
      pending.has(filePath) || fs.existsSync(resolve(filePath)),

    read: (filePath: string): string | null => {
      const entry = pending.get(filePath);
      if (entry) {
        return entry.content;
      }
      const absolutePath = resolve(filePath);
      if (!fs.existsSync(absolutePath)) {
        return null;
      }
      return fs.readFileSync(absolutePath, 'utf8');
    },

    write: (filePath: string, content: string): void => {
      const type = fs.existsSync(resolve(filePath)) ? 'UPDATE' : 'CREATE';
      pending.set(filePath, { content, type });
    },

    listChanges: (): FileChange[] =>
      [...pending.entries()].map(([filePath, { content, type }]) => ({
        path: filePath,
        type,
        content,
      })),

    async flush(): Promise<void> {
      [...pending.entries()].forEach(([filePath, { content }]) => {
        const absolutePath = resolve(filePath);
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        fs.writeFileSync(absolutePath, content);
      });
      pending.clear();
    },
  };
}
