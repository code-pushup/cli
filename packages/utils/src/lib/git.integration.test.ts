import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import { expect } from 'vitest';
import {
  getCurrentBranchOrTag,
  getGitRoot,
  getLatestCommit,
  guardAgainstLocalChanges,
  safeCheckout,
  statusIsClean,
  toGitPath,
} from './git';
import { toUnixPath } from './transform';

describe('git utils in a git repo with a branch and commits', () => {
  const baseDir = join(process.cwd(), 'tmp', 'testing-git-repo');
  const changesDir = join(baseDir, 'changes-dir');
  let git: SimpleGit;

  beforeAll(async () => {
    await mkdir(baseDir, { recursive: true });
    await writeFile(join(baseDir, 'README.md'), '# hello-world\n');

    git = simpleGit(baseDir);
    await git.init();

    await git.addConfig('user.name', 'John Doe');
    await git.addConfig('user.email', 'john.doe@example.com');

    await git.add('README.md');
    await git.commit('Create README');

    await git.checkout(['-b', 'feature-branch']);
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    await rm(changesDir, { recursive: true, force: true });
    await git.checkout(['master']);
  });

  it('should log latest commit', async () => {
    const gitCommitDateRegex =
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2} \d{2}:\d{2}:\d{2} \d{4} [+|-]\d{4}$/;

    await expect(getLatestCommit(git)).resolves.toEqual({
      hash: expect.stringMatching(/^[\da-f]{40}$/),
      message: 'Create README',
      author: 'John Doe',
      date: expect.stringMatching(gitCommitDateRegex),
    });
  });

  it('should find Git root', async () => {
    await expect(getGitRoot(git)).resolves.toBe(toUnixPath(baseDir));
  });

  it('should convert absolute path to relative Git path', async () => {
    await expect(
      toGitPath(join(process.cwd(), 'src', 'utils.ts')),
    ).resolves.toBe('src/utils.ts');
  });

  it('should convert relative Windows path to relative Git path', async () => {
    await expect(toGitPath('Backend\\API\\Startup.cs')).resolves.toBe(
      'Backend/API/Startup.cs',
    );
  });

  it('should keep relative Unix path as is (already a Git path)', async () => {
    await expect(toGitPath('Backend/API/Startup.cs')).resolves.toBe(
      'Backend/API/Startup.cs',
    );
  });

  it('statusIsClean should return false if some changes are given', async () => {
    await mkdir(changesDir, { recursive: true });
    await writeFile(join(changesDir, 'change.md'), '# hello-change\n');
    await expect(statusIsClean(git)).resolves.toBe(false);
  });

  it('statusIsClean should return true if no changes are given', async () => {
    await expect(statusIsClean(git)).resolves.toBe(true);
  });

  it('guardAgainstLocalChanges should throw if history is dirty', async () => {
    await mkdir(changesDir, { recursive: true });
    await writeFile(join(changesDir, 'change.md'), '# hello-change\n');
    await expect(guardAgainstLocalChanges(git)).rejects.toThrow(
      'Working directory needs to be clean before we you can proceed. Commit your local changes or stash them.',
    );
  });

  it('guardAgainstLocalChanges should not throw if history is clean', async () => {
    await expect(guardAgainstLocalChanges(git)).resolves.toBeUndefined();
  });

  it('safeCheckout should checkout target branch in clean state', async () => {
    await expect(git.branch()).resolves.toEqual(
      expect.objectContaining({ current: 'master' }),
    );
    await expect(
      safeCheckout('feature-branch', {}, git),
    ).resolves.toBeUndefined();
    await expect(git.branch()).resolves.toEqual(
      expect.objectContaining({ current: 'feature-branch' }),
    );
  });

  it('safeCheckout should throw if history is dirty', async () => {
    await mkdir(changesDir, { recursive: true });
    await writeFile(join(changesDir, 'change.md'), '# hello-change\n');
    await expect(safeCheckout('master', {}, git)).rejects.toThrow(
      'Working directory needs to be clean before we you can proceed. Commit your local changes or stash them.',
    );
  });

  it('safeCheckout should clean local changes and check out to feature-branch', async () => {
    // needs to get reset to be clean
    await mkdir(changesDir, { recursive: true });
    await writeFile(join(changesDir, 'change.md'), '# hello-change\n');
    // needs to get cleaned to be clean
    await writeFile(join(baseDir, 'README.md'), '# hello-world-2\n');

    await expect(
      safeCheckout('feature-branch', { forceCleanStatus: true }, git),
    ).resolves.toBeUndefined();
    await expect(git.branch()).resolves.toEqual(
      expect.objectContaining({ current: 'feature-branch' }),
    );
  });

  it('getCurrentBranchOrTag should log current branch', async () => {
    await expect(getCurrentBranchOrTag(git)).resolves.toBe('master');
  });
});

describe('git utils in a git repo without a branch and commits', () => {
  const baseDir = join(process.cwd(), 'tmp', 'testing-git-repo');
  let git: SimpleGit;

  beforeAll(async () => {
    await mkdir(baseDir, { recursive: true });
    git = simpleGit(baseDir);
    await git.init();
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('getCurrentBranchOrTag should throw if no branch is given', async () => {
    await expect(getCurrentBranchOrTag(git)).rejects.toThrow(
      "git: 'describe --tags --exact-match' is not a git command. See 'git --help'",
    );
  });
});
