import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import { afterAll, beforeAll, beforeEach, expect } from 'vitest';
import {
  getCurrentBranchOrTag,
  getGitRoot,
  getLatestCommit,
  guardAgainstLocalChanges,
  safeCheckout,
  toGitPath,
} from './git';
import { toUnixPath } from './transform';

// we need a separate folder that is not cleaned in `global-setup.ts`, otherwise the tests can't execute in parallel
const gitTestFolder = 'git-test';
describe('git utils in a git repo', () => {
  const baseDir = join(process.cwd(), gitTestFolder);
  let emptyGit: SimpleGit;

  beforeAll(async () => {
    await mkdir(baseDir, { recursive: true });
    emptyGit = simpleGit(baseDir);
    await emptyGit.init();
    await emptyGit.addConfig('user.name', 'John Doe');
    await emptyGit.addConfig('user.email', 'john.doe@example.com');
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  describe('without a branch and commits', () => {
    it('getCurrentBranchOrTag should throw if no branch or tag is given', async () => {
      await expect(getCurrentBranchOrTag(emptyGit)).rejects.toThrow(
        'Could not get current tag or branch.',
      );
    });
  });

  describe('with a branch and commits clean', () => {
    beforeAll(async () => {
      await writeFile(join(baseDir, 'README.md'), '# hello-world\n');
      await emptyGit.add('README.md');
      await emptyGit.commit('Create README');

      await emptyGit.branch(['feature-branch']);
      await emptyGit.checkout(['master']);
    });

    afterAll(async () => {
      await emptyGit.checkout(['master']);
      await emptyGit.deleteLocalBranch('feature-branch');
    });

    it('should log latest commit', async () => {
      await expect(getLatestCommit(emptyGit)).resolves.toEqual({
        hash: expect.stringMatching(/^[\da-f]{40}$/),
        message: 'Create README',
        author: 'John Doe',
        date: expect.any(Date),
      });
    });

    it('should find Git root', async () => {
      await expect(getGitRoot(emptyGit)).resolves.toBe(toUnixPath(baseDir));
    });

    it('should convert absolute path to relative Git path', async () => {
      await expect(
        toGitPath(join(baseDir, 'src', 'utils.ts'), emptyGit),
      ).resolves.toBe('src/utils.ts');
    });

    it('should convert relative Windows path to relative Git path', async () => {
      await expect(
        toGitPath('Backend\\API\\Startup.cs', emptyGit),
      ).resolves.toBe('../Backend/API/Startup.cs');
    });

    it('should keep relative Unix path as is (already a Git path)', async () => {
      await expect(toGitPath('Backend/API/Startup.cs', emptyGit)).resolves.toBe(
        '../Backend/API/Startup.cs',
      );
    });

    it('getCurrentBranchOrTag should log current branch', async () => {
      await expect(getCurrentBranchOrTag(emptyGit)).resolves.toBe('master');
    });

    it('guardAgainstLocalChanges should not throw if history is clean', async () => {
      await expect(guardAgainstLocalChanges(emptyGit)).resolves.toBeUndefined();
    });

    it('safeCheckout should checkout feature-branch in clean state', async () => {
      await expect(
        safeCheckout('feature-branch', {}, emptyGit),
      ).resolves.toBeUndefined();
      await expect(emptyGit.branch()).resolves.toEqual(
        expect.objectContaining({ current: 'feature-branch' }),
      );
    });

    it('safeCheckout should throw if a given branch does not exist', async () => {
      await expect(
        safeCheckout('non-existing-branch', {}, emptyGit),
      ).rejects.toThrow(
        "pathspec 'non-existing-branch' did not match any file(s) known to git",
      );
    });
  });

  describe('with a branch and commits dirty', () => {
    const newFilePath = join(baseDir, 'new-file.md');

    beforeAll(async () => {
      await writeFile(join(baseDir, 'README.md'), '# hello-world\n');
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
        safeCheckout('feature-branch', { forceCleanStatus: true }, emptyGit),
      ).resolves.toBeUndefined();
      await expect(emptyGit.branch()).resolves.toEqual(
        expect.objectContaining({ current: 'feature-branch' }),
      );
      await expect(emptyGit.status()).resolves.toEqual(
        expect.objectContaining({ files: [] }),
      );
    });

    it('safeCheckout should throw if history is dirty', async () => {
      await expect(safeCheckout('master', {}, emptyGit)).rejects.toThrow(
        'Working directory needs to be clean before we you can proceed. Commit your local changes or stash them.',
      );
    });

    it('guardAgainstLocalChanges should throw if history is dirty', async () => {
      await expect(guardAgainstLocalChanges(emptyGit)).rejects.toThrow(
        'Working directory needs to be clean before we you can proceed. Commit your local changes or stash them.',
      );
    });
  });
});
