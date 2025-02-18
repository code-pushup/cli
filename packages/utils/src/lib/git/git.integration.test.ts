import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import { afterAll, beforeAll, beforeEach, describe, expect } from 'vitest';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { initGitRepo } from '@code-pushup/test-utils';
import { toUnixPath } from '../transform.js';
import {
  getGitRoot,
  guardAgainstLocalChanges,
  safeCheckout,
  toGitPath,
} from './git.js';

describe('git utils in a git repo', () => {
  const baseDir = path.join(process.cwd(), 'tmp', 'git-tests');
  let emptyGit: SimpleGit;

  beforeAll(async () => {
    await mkdir(baseDir, { recursive: true });
    emptyGit = await initGitRepo(simpleGit, { baseDir, baseBranch: 'master' });
  });

  afterAll(async () => {
    await teardownTestFolder(baseDir);
  });

  describe('without a branch and commits', () => {
    it('getGitRoot should return git root in a set up repo', async () => {
      await expect(getGitRoot(emptyGit)).resolves.toMatch(/tmp\/git-tests$/);
    });
  });

  describe('with a branch and commits clean', () => {
    beforeAll(async () => {
      await writeFile(path.join(baseDir, 'README.md'), '# hello-world\n');
      await emptyGit.add('README.md');
      await emptyGit.commit('Create README');

      await emptyGit.branch(['feature-branch']);
      await emptyGit.checkout(['master']);
    });

    afterAll(async () => {
      await emptyGit.checkout(['master']);
      await emptyGit.deleteLocalBranch('feature-branch');
    });

    it('should find Git root', async () => {
      await expect(getGitRoot(emptyGit)).resolves.toBe(toUnixPath(baseDir));
    });

    it('should convert absolute path to relative Git path', async () => {
      await expect(
        toGitPath(path.join(baseDir, 'src', 'utils.ts'), emptyGit),
      ).resolves.toBe('src/utils.ts');
    });

    it('should convert relative Windows path to relative Git path', async () => {
      await expect(
        toGitPath(String.raw`Backend\API\Startup.cs`, emptyGit),
      ).resolves.toBe('../../Backend/API/Startup.cs');
    });

    it('should keep relative Unix path as is (already a Git path)', async () => {
      await expect(toGitPath('Backend/API/Startup.cs', emptyGit)).resolves.toBe(
        '../../Backend/API/Startup.cs',
      );
    });

    it('guardAgainstLocalChanges should not throw if history is clean', async () => {
      await expect(guardAgainstLocalChanges(emptyGit)).resolves.toBeUndefined();
    });

    it('safeCheckout should checkout feature-branch in clean state', async () => {
      await expect(
        safeCheckout('feature-branch', undefined, emptyGit),
      ).resolves.toBeUndefined();
      await expect(emptyGit.branch()).resolves.toEqual(
        expect.objectContaining({ current: 'feature-branch' }),
      );
    });

    it('safeCheckout should throw if a given branch does not exist', async () => {
      await expect(
        safeCheckout('non-existing-branch', undefined, emptyGit),
      ).rejects.toThrow(
        "pathspec 'non-existing-branch' did not match any file(s) known to git",
      );
    });
  });

  describe('with a branch and commits dirty', () => {
    const newFilePath = path.join(baseDir, 'new-file.md');

    beforeAll(async () => {
      await writeFile(path.join(baseDir, 'README.md'), '# hello-world\n');
      await emptyGit.add('README.md');
      await emptyGit.commit('Create README');

      await emptyGit.branch(['feature-branch']);
      await emptyGit.checkout(['master']);
    });

    beforeEach(async () => {
      await writeFile(newFilePath, '# New File\n');
    });

    afterEach(async () => {
      try {
        const s = await stat(newFilePath);
        if (s.isFile()) {
          await rm(newFilePath);
        }
      } catch {
        // file not present (already cleaned)
      }
    });

    afterAll(async () => {
      await emptyGit.checkout(['master']);
      await emptyGit.deleteLocalBranch('feature-branch');
    });

    it('safeCheckout should clean local changes and check out to feature-branch', async () => {
      await expect(
        safeCheckout('feature-branch', true, emptyGit),
      ).resolves.toBeUndefined();
      await expect(emptyGit.branch()).resolves.toEqual(
        expect.objectContaining({ current: 'feature-branch' }),
      );
      await expect(emptyGit.status()).resolves.toEqual(
        expect.objectContaining({ files: [] }),
      );
    });

    it('safeCheckout should throw if history is dirty', async () => {
      await expect(safeCheckout('master', undefined, emptyGit)).rejects.toThrow(
        `Working directory needs to be clean before we you can proceed. Commit your local changes or stash them: \n ${JSON.stringify(
          {
            not_added: ['new-file.md'],
            files: [
              {
                path: 'new-file.md',
                index: '?',
                working_dir: '?',
              },
            ],
          },
          null,
          2,
        )}`,
      );
    });

    it('guardAgainstLocalChanges should throw if history is dirty', async () => {
      let errorMsg;
      try {
        await guardAgainstLocalChanges(emptyGit);
      } catch (error) {
        errorMsg = (error as Error).message;
      }
      expect(errorMsg).toMatch(
        'Working directory needs to be clean before we you can proceed. Commit your local changes or stash them:',
      );
      expect(errorMsg).toMatch(
        JSON.stringify(
          {
            not_added: ['new-file.md'],
            files: [
              {
                path: 'new-file.md',
                index: '?',
                working_dir: '?',
              },
            ],
          },
          null,
          2,
        ),
      );
    });
  });
});
