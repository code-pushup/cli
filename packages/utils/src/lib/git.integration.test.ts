import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import { beforeAll, beforeEach, expect } from 'vitest';
import {
  getCurrentBranchOrTag,
  getGitRoot,
  getLatestCommit,
  guardAgainstLocalChanges,
  safeCheckout,
  toGitPath,
} from './git';
import { toUnixPath } from './transform';

describe('git helper tests', () => {
  describe('git utils in a git repo without a branch and commits', () => {
    const baseDir = join(
      process.cwd(),
      'tmp',
      'testing-git-repo-without-branch-and-commits',
    );
    let emptyGit: SimpleGit;

    beforeAll(async () => {
      await mkdir(baseDir, { recursive: true });
      emptyGit = simpleGit(baseDir);
      await emptyGit.init();
    });

    afterAll(async () => {
      await rm(baseDir, { recursive: true, force: true });
    });

    it('getCurrentBranchOrTag should throw if no branch or tag is given', async () => {
      await expect(getCurrentBranchOrTag(emptyGit)).rejects.toThrow(
        'Could not get current tag or branch.',
      );
    });
  });

  describe('git utils in a git repo with a branch and commits clean', () => {
    const baseDir = join(
      process.cwd(),
      'tmp',
      'testing-git-repo-with-branch-and-commits-clean',
    );
    let cleanGit: SimpleGit;

    beforeAll(async () => {
      await mkdir(baseDir, { recursive: true });

      cleanGit = simpleGit(baseDir);
      await cleanGit.init();

      await cleanGit.addConfig('user.name', 'John Doe');
      await cleanGit.addConfig('user.email', 'john.doe@example.com');

      await writeFile(join(baseDir, 'README.md'), '# hello-world\n');
      await cleanGit.add('README.md');
      await cleanGit.commit('Create README');

      await cleanGit.branch(['feature-branch']);
      await cleanGit.checkout(['master']);
    });

    afterAll(async () => {
      await rm(baseDir, { recursive: true, force: true });
    });

    it('should log latest commit', async () => {
      const gitCommitDateRegex =
        /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2} \d{2}:\d{2}:\d{2} \d{4} [+|-]\d{4}$/;

      await expect(getLatestCommit(cleanGit)).resolves.toEqual({
        hash: expect.stringMatching(/^[\da-f]{40}$/),
        message: 'Create README',
        author: 'John Doe',
        date: expect.stringMatching(gitCommitDateRegex),
      });
    });

    it('should find Git root', async () => {
      await expect(getGitRoot(cleanGit)).resolves.toBe(toUnixPath(baseDir));
    });

    it('should convert absolute path to relative Git path', async () => {
      await expect(
        toGitPath(join(baseDir, 'src', 'utils.ts'), cleanGit),
      ).resolves.toBe('src/utils.ts');
    });

    it('should convert relative Windows path to relative Git path', async () => {
      await expect(
        toGitPath('Backend\\API\\Startup.cs', cleanGit),
      ).resolves.toBe('../../Backend/API/Startup.cs');
    });

    it('should keep relative Unix path as is (already a Git path)', async () => {
      await expect(toGitPath('Backend/API/Startup.cs', cleanGit)).resolves.toBe(
        '../../Backend/API/Startup.cs',
      );
    });

    it('getCurrentBranchOrTag should log current branch', async () => {
      await expect(getCurrentBranchOrTag(cleanGit)).resolves.toBe('master');
    });

    it('guardAgainstLocalChanges should not throw if history is clean', async () => {
      await expect(guardAgainstLocalChanges(cleanGit)).resolves.toBeUndefined();
    });

    it('safeCheckout should checkout feature-branch in clean state', async () => {
      await expect(
        safeCheckout('feature-branch', {}, cleanGit),
      ).resolves.toBeUndefined();
      await expect(cleanGit.branch()).resolves.toEqual(
        expect.objectContaining({ current: 'feature-branch' }),
      );
    });

    it('safeCheckout should throw if a given branch does not exist', async () => {
      await expect(
        safeCheckout('non-existing-branch', {}, cleanGit),
      ).rejects.toThrow(
        "pathspec 'non-existing-branch' did not match any file(s) known to git",
      );
    });
  });

  describe('git utils in a git repo with a branch and commits dirty', () => {
    const baseDir = join(
      process.cwd(),
      'tmp',
      'testing-git-repo-with-branch-and-commits-dirty',
    );
    const newFilePath = join(baseDir, 'new-file.md');
    let dirtyGit: SimpleGit;

    beforeAll(async () => {
      await mkdir(baseDir, { recursive: true });

      dirtyGit = simpleGit(baseDir);
      await dirtyGit.init();
      await dirtyGit.addConfig('user.name', 'John Doe');
      await dirtyGit.addConfig('user.email', 'john.doe@example.com');

      await writeFile(join(baseDir, 'README.md'), '# hello-world\n');
      await dirtyGit.add('README.md');
      await dirtyGit.commit('Create README');

      await dirtyGit.branch(['feature-branch']);
      await dirtyGit.checkout(['master']);
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
      await rm(baseDir, { recursive: true, force: true });
    });

    it('safeCheckout should clean local changes and check out to feature-branch', async () => {
      await expect(
        safeCheckout('feature-branch', { forceCleanStatus: true }, dirtyGit),
      ).resolves.toBeUndefined();
      await expect(dirtyGit.branch()).resolves.toEqual(
        expect.objectContaining({ current: 'feature-branch' }),
      );
      await expect(dirtyGit.status()).resolves.toEqual(
        expect.objectContaining({ files: [] }),
      );
    });

    it('safeCheckout should throw if history is dirty', async () => {
      await expect(safeCheckout('master', {}, dirtyGit)).rejects.toThrow(
        'Working directory needs to be clean before we you can proceed. Commit your local changes or stash them.',
      );
    });

    it('guardAgainstLocalChanges should throw if history is dirty', async () => {
      await expect(guardAgainstLocalChanges(dirtyGit)).rejects.toThrow(
        'Working directory needs to be clean before we you can proceed. Commit your local changes or stash them.',
      );
    });
  });
});
