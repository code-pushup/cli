import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { resolveGitignore, updateGitignore } from './gitignore.js';

describe('resolveGitignore', () => {
  it('should return CREATE change with comment when no .gitignore exists', async () => {
    vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);

    await expect(resolveGitignore()).resolves.toStrictEqual({
      type: 'CREATE',
      path: '.gitignore',
      content: '# Code PushUp reports\n.code-pushup\n',
    });
  });

  it('should return UPDATE change with blank line separator for existing .gitignore', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules\n' }, MEMFS_VOLUME);

    await expect(resolveGitignore()).resolves.toStrictEqual({
      type: 'UPDATE',
      path: '.gitignore',
      content: 'node_modules\n\n# Code PushUp reports\n.code-pushup\n',
    });
  });

  it('should preserve existing blank line before appending', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules\n\n' }, MEMFS_VOLUME);

    await expect(resolveGitignore()).resolves.toStrictEqual({
      type: 'UPDATE',
      path: '.gitignore',
      content: 'node_modules\n\n# Code PushUp reports\n.code-pushup\n',
    });
  });

  it('should add double newline separator when .gitignore has no trailing newline', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules' }, MEMFS_VOLUME);

    await expect(resolveGitignore()).resolves.toStrictEqual({
      type: 'UPDATE',
      path: '.gitignore',
      content: 'node_modules\n\n# Code PushUp reports\n.code-pushup\n',
    });
  });

  it('should return null if entry already in .gitignore', async () => {
    vol.fromJSON({ '.gitignore': '.code-pushup\n' }, MEMFS_VOLUME);

    await expect(resolveGitignore()).resolves.toBeNull();
  });
});

describe('updateGitignore', () => {
  it('should skip writing when change is null', async () => {
    vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);

    await updateGitignore(null);

    expect(vol.toJSON(MEMFS_VOLUME)).toStrictEqual({
      [`${MEMFS_VOLUME}/package.json`]: '{}',
    });
  });

  it('should write .gitignore file to git root', async () => {
    vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);

    await updateGitignore({
      type: 'CREATE',
      path: '.gitignore',
      content: '# Code PushUp reports\n.code-pushup\n',
    });

    await expect(readFile(`${MEMFS_VOLUME}/.gitignore`, 'utf8')).resolves.toBe(
      '# Code PushUp reports\n.code-pushup\n',
    );
  });
});
