/** A single file operation recorded by the virtual tree. */
export type FileChange = {
  path: string;
  type: 'CREATE' | 'UPDATE';
  content: string;
};

/** Abstraction over `node:fs` used by the virtual tree for disk I/O. */
export type FileSystemAdapter = {
  readFile: (path: string, encoding: 'utf8') => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  mkdir: (
    path: string,
    options: { recursive: true },
  ) => Promise<string | undefined>;
  unlink: (path: string) => Promise<void>;
};

/** Virtual file system that buffers writes in memory until flushed to disk. */
export type Tree = {
  root: string;
  exists: (filePath: string) => Promise<boolean>;
  read: (filePath: string) => Promise<string | null>;
  write: (filePath: string, content: string) => Promise<void>;
  listChanges: () => FileChange[];
  flush: () => Promise<void>;
};

/** Internal pending-entry shape held by the virtual tree. */
export type PendingEntry = {
  content: string;
  type: 'CREATE' | 'UPDATE';
  original: string | null;
};
