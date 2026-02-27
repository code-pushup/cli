import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { resolveGitignore } from './gitignore.js';
import { createTree } from './virtual-fs.js';

describe('resolveGitignore', () => {
  it('should create .gitignore with comment when it does not exist', async () => {
    vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);
    const tree = createTree(MEMFS_VOLUME);

    await resolveGitignore(tree);

    expect(tree.listChanges()).toStrictEqual([
      {
        type: 'CREATE',
        path: '.gitignore',
        content: '# Code PushUp reports\n.code-pushup\n',
      },
    ]);
  });

  it('should update .gitignore with blank line separator when it already exists', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules\n' }, MEMFS_VOLUME);
    const tree = createTree(MEMFS_VOLUME);

    await resolveGitignore(tree);

    expect(tree.listChanges()).toStrictEqual([
      {
        type: 'UPDATE',
        path: '.gitignore',
        content: 'node_modules\n\n# Code PushUp reports\n.code-pushup\n',
      },
    ]);
  });

  it('should preserve existing blank line before appending', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules\n\n' }, MEMFS_VOLUME);
    const tree = createTree(MEMFS_VOLUME);

    await resolveGitignore(tree);

    expect(tree.listChanges()).toStrictEqual([
      {
        type: 'UPDATE',
        path: '.gitignore',
        content: 'node_modules\n\n# Code PushUp reports\n.code-pushup\n',
      },
    ]);
  });

  it('should add double newline separator when .gitignore has no trailing newline', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules' }, MEMFS_VOLUME);
    const tree = createTree(MEMFS_VOLUME);

    await resolveGitignore(tree);

    expect(tree.listChanges()).toStrictEqual([
      {
        type: 'UPDATE',
        path: '.gitignore',
        content: 'node_modules\n\n# Code PushUp reports\n.code-pushup\n',
      },
    ]);
  });

  it('should skip if entry already in .gitignore', async () => {
    vol.fromJSON({ '.gitignore': '.code-pushup\n' }, MEMFS_VOLUME);
    const tree = createTree(MEMFS_VOLUME);

    await resolveGitignore(tree);

    expect(tree.listChanges()).toStrictEqual([]);
  });

  it('should skip if **/.code-pushup entry already in .gitignore', async () => {
    vol.fromJSON({ '.gitignore': '**/.code-pushup\n' }, MEMFS_VOLUME);
    const tree = createTree(MEMFS_VOLUME);

    await resolveGitignore(tree);

    expect(tree.listChanges()).toStrictEqual([]);
  });

  it('should skip if entry exists among comments and other entries', async () => {
    vol.fromJSON(
      { '.gitignore': '# build output\ndist\n\n# reports\n.code-pushup\n' },
      MEMFS_VOLUME,
    );
    const tree = createTree(MEMFS_VOLUME);

    await resolveGitignore(tree);

    expect(tree.listChanges()).toStrictEqual([]);
  });

  it('should skip if entry has leading and trailing whitespace', async () => {
    vol.fromJSON({ '.gitignore': '  .code-pushup  \n' }, MEMFS_VOLUME);
    const tree = createTree(MEMFS_VOLUME);

    await resolveGitignore(tree);

    expect(tree.listChanges()).toStrictEqual([]);
  });

  it('should not match commented-out entry', async () => {
    vol.fromJSON({ '.gitignore': '# .code-pushup\n' }, MEMFS_VOLUME);
    const tree = createTree(MEMFS_VOLUME);

    await resolveGitignore(tree);

    expect(tree.listChanges()).toStrictEqual([
      {
        type: 'UPDATE',
        path: '.gitignore',
        content: '# .code-pushup\n\n# Code PushUp reports\n.code-pushup\n',
      },
    ]);
  });
});

describe('resolveGitignore - flush', () => {
  it('should write .gitignore file to disk on flush', async () => {
    vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);
    const tree = createTree(MEMFS_VOLUME);

    await resolveGitignore(tree);
    await tree.flush();

    await expect(readFile(`${MEMFS_VOLUME}/.gitignore`, 'utf8')).resolves.toBe(
      '# Code PushUp reports\n.code-pushup\n',
    );
  });

  it('should skip writing when entry already exists', async () => {
    vol.fromJSON({ '.gitignore': '.code-pushup\n' }, MEMFS_VOLUME);
    const tree = createTree(MEMFS_VOLUME);

    await resolveGitignore(tree);
    await tree.flush();

    await expect(readFile(`${MEMFS_VOLUME}/.gitignore`, 'utf8')).resolves.toBe(
      '.code-pushup\n',
    );
  });
});
