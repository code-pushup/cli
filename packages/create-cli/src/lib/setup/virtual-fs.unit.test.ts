import { toUnixPath } from '@code-pushup/utils';
import type { FileSystemAdapter } from './types.js';
import { createTree } from './virtual-fs.js';

function createMockFs(
  files: Record<string, string> = {},
): FileSystemAdapter & { written: Map<string, string>; dirs: Set<string> } {
  const store = new Map(Object.entries(files));
  const written = new Map<string, string>();
  const dirs = new Set<string>();

  return {
    written,
    dirs,
    async readFile(path: string) {
      const content = store.get(toUnixPath(path));
      if (content == null) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      return content;
    },
    async writeFile(path: string, content: string) {
      store.set(toUnixPath(path), content);
      written.set(toUnixPath(path), content);
    },
    async exists(path: string) {
      return store.has(toUnixPath(path));
    },
    async mkdir(path: string): Promise<undefined> {
      dirs.add(toUnixPath(path));
    },
  };
}

describe('createTree', () => {
  it('should report the root directory', () => {
    expect(createTree('/project').root).toBe('/project');
  });

  describe('exists', () => {
    it('should return false for non-existent files', async () => {
      await expect(
        createTree('/project', createMockFs()).exists('missing.ts'),
      ).resolves.toBeFalse();
    });

    it('should return true for files on disk', async () => {
      await expect(
        createTree(
          '/project',
          createMockFs({ '/project/existing.ts': 'content' }),
        ).exists('existing.ts'),
      ).resolves.toBeTrue();
    });

    it('should return true for files written to the tree', async () => {
      const tree = createTree('/project', createMockFs());
      await tree.write('new.ts', 'content');
      await expect(tree.exists('new.ts')).resolves.toBeTrue();
    });
  });

  describe('read', () => {
    it('should return null for non-existent files', async () => {
      await expect(
        createTree('/project', createMockFs()).read('missing.ts'),
      ).resolves.toBeNull();
    });

    it('should read files from disk', async () => {
      await expect(
        createTree(
          '/project',
          createMockFs({ '/project/existing.ts': 'disk content' }),
        ).read('existing.ts'),
      ).resolves.toBe('disk content');
    });

    it('should return pending content over disk content', async () => {
      const tree = createTree(
        '/project',
        createMockFs({ '/project/file.ts': 'old' }),
      );
      await tree.write('file.ts', 'new');
      await expect(tree.read('file.ts')).resolves.toBe('new');
    });
  });

  describe('write', () => {
    it('should mark new files as CREATE', async () => {
      const tree = createTree('/project', createMockFs());
      await tree.write('new.ts', 'content');

      expect(tree.listChanges()).toStrictEqual([
        { path: 'new.ts', type: 'CREATE', content: 'content' },
      ]);
    });

    it('should mark existing files as UPDATE', async () => {
      const tree = createTree(
        '/project',
        createMockFs({ '/project/existing.ts': 'old' }),
      );
      await tree.write('existing.ts', 'new');

      expect(tree.listChanges()).toStrictEqual([
        { path: 'existing.ts', type: 'UPDATE', content: 'new' },
      ]);
    });
  });

  describe('listChanges', () => {
    it('should return empty array when no changes are detected', () => {
      expect(
        createTree('/project', createMockFs()).listChanges(),
      ).toStrictEqual([]);
    });

    it('should return all pending changes', async () => {
      const tree = createTree(
        '/project',
        createMockFs({ '/project/existing.ts': 'old' }),
      );
      await tree.write('new.ts', 'created');
      await tree.write('existing.ts', 'updated');

      expect(tree.listChanges()).toHaveLength(2);
      expect(tree.listChanges()).toContainEqual({
        path: 'new.ts',
        type: 'CREATE',
        content: 'created',
      });
      expect(tree.listChanges()).toContainEqual({
        path: 'existing.ts',
        type: 'UPDATE',
        content: 'updated',
      });
    });
  });

  describe('flush', () => {
    it('should write all pending files to the fs', async () => {
      const fs = createMockFs();
      const tree = createTree('/project', fs);
      await tree.write('src/config.ts', 'export default {};');

      await tree.flush();

      expect(fs.written.get('/project/src/config.ts')).toBe(
        'export default {};',
      );
    });

    it('should create parent directories', async () => {
      const fs = createMockFs();
      const tree = createTree('/project', fs);
      await tree.write('src/deep/config.ts', 'content');

      await tree.flush();

      expect(fs.dirs).toContain('/project/src/deep');
    });

    it('should clear pending changes after flush', async () => {
      const tree = createTree('/project', createMockFs());
      await tree.write('file.ts', 'content');

      await tree.flush();

      expect(tree.listChanges()).toStrictEqual([]);
    });

    it('should not write anything when no changes are pending', async () => {
      const fs = createMockFs();

      await createTree('/project', fs).flush();

      expect(fs.written.size).toBe(0);
    });
  });
});
