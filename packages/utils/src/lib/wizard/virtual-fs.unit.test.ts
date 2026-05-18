import { toUnixPath } from '../transform.js';
import type { FileSystemAdapter } from './types.js';
import { createTree } from './virtual-fs.js';

type MockFs = FileSystemAdapter & {
  written: Map<string, string>;
  unlinked: Set<string>;
  dirs: Set<string>;
};

function createMockFs(
  files: Record<string, string> = {},
  options: { failOnWrite?: string } = {},
): MockFs {
  const store = new Map(Object.entries(files));
  const written = new Map<string, string>();
  const unlinked = new Set<string>();
  const dirs = new Set<string>();
  return {
    written,
    unlinked,
    dirs,
    async readFile(path: string) {
      const content = store.get(toUnixPath(path));
      if (content == null) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      return content;
    },
    async writeFile(path: string, content: string) {
      if (options.failOnWrite === toUnixPath(path)) {
        throw new Error(`EACCES: permission denied, open '${path}'`);
      }
      store.set(toUnixPath(path), content);
      written.set(toUnixPath(path), content);
    },
    async exists(path: string) {
      return store.has(toUnixPath(path));
    },
    async mkdir(path: string): Promise<undefined> {
      dirs.add(toUnixPath(path));
    },
    async unlink(path: string) {
      store.delete(toUnixPath(path));
      unlinked.add(toUnixPath(path));
    },
  };
}

describe('createTree', () => {
  it('should report the root directory', () => {
    expect(createTree('/project').root).toBe('/project');
  });

  it('should report exists() as false for non-existent files', async () => {
    await expect(
      createTree('/project', createMockFs()).exists('missing.ts'),
    ).resolves.toBeFalse();
  });

  it('should report exists() as true for files on disk', async () => {
    await expect(
      createTree(
        '/project',
        createMockFs({ '/project/existing.ts': 'content' }),
      ).exists('existing.ts'),
    ).resolves.toBeTrue();
  });

  it('should report exists() as true for files written to the tree', async () => {
    const tree = createTree('/project', createMockFs());
    await tree.write('new.ts', 'content');

    await expect(tree.exists('new.ts')).resolves.toBeTrue();
  });

  it('should return null from read() for non-existent files', async () => {
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

  it('should return pending content over disk content from read()', async () => {
    const tree = createTree(
      '/project',
      createMockFs({ '/project/file.ts': 'old' }),
    );
    await tree.write('file.ts', 'new');

    await expect(tree.read('file.ts')).resolves.toBe('new');
  });

  it('should mark new files as CREATE on write()', async () => {
    const tree = createTree('/project', createMockFs());
    await tree.write('new.ts', 'content');

    expect(tree.listChanges()).toStrictEqual([
      { path: 'new.ts', type: 'CREATE', content: 'content' },
    ]);
  });

  it('should preserve CREATE type when writing to the same path twice', async () => {
    const tree = createTree('/project', createMockFs());
    await tree.write('new.ts', 'first');
    await tree.write('new.ts', 'second');

    expect(tree.listChanges()).toStrictEqual([
      { path: 'new.ts', type: 'CREATE', content: 'second' },
    ]);
  });

  it('should mark existing files as UPDATE on write()', async () => {
    const tree = createTree(
      '/project',
      createMockFs({ '/project/existing.ts': 'old' }),
    );
    await tree.write('existing.ts', 'new');

    expect(tree.listChanges()).toStrictEqual([
      { path: 'existing.ts', type: 'UPDATE', content: 'new' },
    ]);
  });

  it('should skip recording when written content matches disk content', async () => {
    const tree = createTree(
      '/project',
      createMockFs({ '/project/existing.ts': 'same' }),
    );
    await tree.write('existing.ts', 'same');

    expect(tree.listChanges()).toStrictEqual([]);
  });

  it('should skip re-recording when pending content is overwritten with the same value', async () => {
    const tree = createTree('/project', createMockFs());
    await tree.write('new.ts', 'content');
    const before = tree.listChanges();
    await tree.write('new.ts', 'content');

    expect(tree.listChanges()).toStrictEqual(before);
  });

  it('should return empty array from listChanges() when no changes are detected', () => {
    expect(createTree('/project', createMockFs()).listChanges()).toStrictEqual(
      [],
    );
  });

  it('should return all pending changes from listChanges()', async () => {
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

  it('should buffer writes without touching the fs until flush()', async () => {
    const fs = createMockFs();
    const tree = createTree('/project', fs);
    await tree.write('first.ts', 'one');
    await tree.write('second.ts', 'two');

    expect(fs.written.size).toBe(0);
  });

  it('should write all pending files to the fs on flush()', async () => {
    const fs = createMockFs();
    const tree = createTree('/project', fs);
    await tree.write('src/config.ts', 'export default {};');

    await tree.flush();

    expect(fs.written.get('/project/src/config.ts')).toBe('export default {};');
  });

  it('should create parent directories on flush()', async () => {
    const fs = createMockFs();
    const tree = createTree('/project', fs);
    await tree.write('src/deep/config.ts', 'content');

    await tree.flush();

    expect(fs.dirs).toContain('/project/src/deep');
  });

  it('should clear pending changes after flush()', async () => {
    const tree = createTree('/project', createMockFs());
    await tree.write('file.ts', 'content');

    await tree.flush();

    expect(tree.listChanges()).toStrictEqual([]);
  });

  it('should not write anything on flush() when no changes are pending', async () => {
    const fs = createMockFs();

    await createTree('/project', fs).flush();

    expect(fs.written.size).toBe(0);
  });

  it('should rollback created files by unlinking them when a later write fails', async () => {
    const fs = createMockFs({}, { failOnWrite: '/project/second.ts' });
    const tree = createTree('/project', fs);
    await tree.write('first.ts', 'one');
    await tree.write('second.ts', 'two');

    await expect(tree.flush()).rejects.toThrow(/EACCES/);

    expect(fs.unlinked).toContain('/project/first.ts');
  });

  it('should rollback updated files by restoring original content when a later write fails', async () => {
    const fs = createMockFs(
      { '/project/existing.ts': 'original' },
      { failOnWrite: '/project/second.ts' },
    );
    const tree = createTree('/project', fs);
    await tree.write('existing.ts', 'modified');
    await tree.write('second.ts', 'new');

    await expect(tree.flush()).rejects.toThrow(/EACCES/);

    expect(fs.written.get('/project/existing.ts')).toBe('original');
    expect(fs.unlinked).not.toContain('/project/existing.ts');
  });

  it('should keep pending changes after a failed flush() so it can be retried', async () => {
    const fs = createMockFs({}, { failOnWrite: '/project/second.ts' });
    const tree = createTree('/project', fs);
    await tree.write('first.ts', 'one');
    await tree.write('second.ts', 'two');

    await expect(tree.flush()).rejects.toThrow(/EACCES/);

    expect(tree.listChanges()).toHaveLength(2);
  });
});
