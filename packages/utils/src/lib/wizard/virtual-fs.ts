import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileExists } from '../file-system.js';
import type {
  FileChange,
  FileSystemAdapter,
  PendingEntry,
  Tree,
} from './types.js';

const DEFAULT_FS: FileSystemAdapter = {
  readFile,
  writeFile,
  exists: fileExists,
  mkdir,
  unlink,
};

// eslint-disable-next-line max-lines-per-function
export function createTree(
  root: string,
  fs: FileSystemAdapter = DEFAULT_FS,
): Tree {
  const pending = new Map<string, PendingEntry>();
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
      const absolute = resolve(filePath);
      if (!(await fs.exists(absolute))) {
        return null;
      }
      return fs.readFile(absolute, 'utf8');
    },

    write: async (filePath: string, content: string): Promise<void> => {
      const entry = pending.get(filePath);
      if (entry) {
        if (entry.content !== content) {
          pending.set(filePath, { ...entry, content });
        }
        return;
      }
      const absolute = resolve(filePath);
      const existing = await fs.readFile(absolute, 'utf8').catch(() => null);
      if (existing === content) {
        return;
      }
      pending.set(filePath, {
        content,
        type: existing == null ? 'CREATE' : 'UPDATE',
        original: existing,
      });
    },

    listChanges: (): FileChange[] =>
      [...pending.entries()].map(([filePath, { content, type }]) => ({
        path: filePath,
        type,
        content,
      })),

    async flush(): Promise<void> {
      const written = new Set<string>();
      try {
        await [...pending.entries()].reduce<Promise<null>>(
          async (acc, [filePath, { content }]) => {
            await acc;
            const absolutePath = resolve(filePath);
            await fs.mkdir(path.dirname(absolutePath), { recursive: true });
            await fs.writeFile(absolutePath, content);
            written.add(filePath);
            return null;
          },
          Promise.resolve(null),
        );
        pending.clear();
      } catch (error) {
        await rollback([...written], pending, fs, resolve);
        throw error;
      }
    },
  };
}

async function rollback(
  written: string[],
  pending: Map<string, PendingEntry>,
  fs: FileSystemAdapter,
  resolve: (filePath: string) => string,
): Promise<void> {
  await Promise.allSettled(
    written.map(async filePath => {
      const entry = pending.get(filePath);
      if (!entry) {
        return;
      }
      const absolutePath = resolve(filePath);
      if (entry.original == null) {
        await fs.unlink(absolutePath);
        return;
      }
      await fs.writeFile(absolutePath, entry.original);
    }),
  );
}
