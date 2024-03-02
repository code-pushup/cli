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

// we need a separate folder that is not cleaned in `global-setup.ts`, otherwise the tests can't execute in parallel
const gitTestFolder = 'git-test';

describe('git utils in a git repo without a branch and commits', () => {
  const baseDir = join(
    process.cwd(),
    gitTestFolder,
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
    gitTestFolder,
    'testing-git-repo-with-branch-and-commits-clean',
  );
  let intiGit: SimpleGit;

  beforeAll(async () => {
    await mkdir(baseDir, { recursive: true });

    intiGit = simpleGit(baseDir);
    await intiGit.init();

    await intiGit.addConfig('user.name', 'John Doe');
    await intiGit.addConfig('user.email', 'john.doe@example.com');

    await writeFile(join(baseDir, 'README.md'), '# hello-world\n');
    await intiGit.add('README.md');
    await intiGit.commit('Create README');

    await intiGit.branch(['feature-branch']);
    await intiGit.checkout(['master']);
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('should log latest commit', async () => {
    const gitCommitDateRegex =
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2} \d{2}:\d{2}:\d{2} \d{4} [+|-]\d{4}$/;

    await expect(getLatestCommit(intiGit)).resolves.toEqual({
      hash: expect.stringMatching(/^[\da-f]{40}$/),
      message: 'Create README',
      author: 'John Doe',
      date: expect.stringMatching(gitCommitDateRegex),
    });
  });

  it('should find Git root', async () => {
    await expect(getGitRoot(intiGit)).resolves.toBe(toUnixPath(baseDir));
  });

  it('should convert absolute path to relative Git path', async () => {
    await expect(
      toGitPath(join(baseDir, 'src', 'utils.ts'), intiGit),
    ).resolves.toBe('src/utils.ts');
  });

  it('should convert relative Windows path to relative Git path', async () => {
    await expect(toGitPath('Backend\\API\\Startup.cs', intiGit)).resolves.toBe(
      '../../Backend/API/Startup.cs',
    );
  });

  it('should keep relative Unix path as is (already a Git path)', async () => {
    await expect(toGitPath('Backend/API/Startup.cs', intiGit)).resolves.toBe(
      '../../Backend/API/Startup.cs',
    );
  });

  it('getCurrentBranchOrTag should log current branch', async () => {
    await expect(getCurrentBranchOrTag(intiGit)).resolves.toBe('master');
  });

  it('guardAgainstLocalChanges should not throw if history is clean', async () => {
    await expect(guardAgainstLocalChanges(intiGit)).resolves.toBeUndefined();
  });

  it('safeCheckout should checkout feature-branch in clean state', async () => {
    await expect(
      safeCheckout('feature-branch', {}, intiGit),
    ).resolves.toBeUndefined();
    await expect(intiGit.branch()).resolves.toEqual(
      expect.objectContaining({ current: 'feature-branch' }),
    );
  });

  it('safeCheckout should throw if a given branch does not exist', async () => {
    await expect(
      safeCheckout('non-existing-branch', {}, intiGit),
    ).rejects.toThrow(
      "pathspec 'non-existing-branch' did not match any file(s) known to git",
    );
  });
});

describe('git utils in a git repo with a branch and commits dirty', () => {
  const baseDir = join(
    process.cwd(),
    gitTestFolder,
    'testing-git-repo-with-branch-and-commits-dirty',
  );
  const newFilePath = join(baseDir, 'new-file.md');
  let dirtyGt: SimpleGit;

  beforeAll(async () => {
    await mkdir(baseDir, { recursive: true });

    dirtyGt = simpleGit(baseDir);
    await dirtyGt.init();

    await writeFile(join(baseDir, 'README.md'), '# hello-world\n');
    await dirtyGt.add('README.md');
    await dirtyGt.commit('Create README');

    await dirtyGt.branch(['feature-branch']);
    await dirtyGt.checkout(['master']);
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
      safeCheckout('feature-branch', { forceCleanStatus: true }, dirtyGt),
    ).resolves.toBeUndefined();
    await expect(dirtyGt.branch()).resolves.toEqual(
      expect.objectContaining({ current: 'feature-branch' }),
    );
    await expect(dirtyGt.status()).resolves.toEqual(
      expect.objectContaining({ files: [] }),
    );
  });

  it('safeCheckout should throw if history is dirty', async () => {
    await expect(safeCheckout('master', {}, dirtyGt)).rejects.toThrow(
      'Working directory needs to be clean before we you can proceed. Commit your local changes or stash them.',
    );
  });

  it('guardAgainstLocalChanges should throw if history is dirty', async () => {
    await expect(guardAgainstLocalChanges(dirtyGt)).rejects.toThrow(
      'Working directory needs to be clean before we you can proceed. Commit your local changes or stash them.',
    );
  });
});
