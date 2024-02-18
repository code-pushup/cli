import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import { expect } from 'vitest';
import { toUnixPath } from './transform';
import {afterEach, beforeAll, beforeEach, expect} from 'vitest';
import { makeStatusClean, makeStatusDirty } from '@code-pushup/testing-utils';
import {
  branchHasChanges,
  getCurrentBranchOrTag,
  getLatestCommit, git,
  guardAgainstDirtyRepo,
  safeCheckout,
  getGitRoot, toGitPath
} from './git';

describe('git utils', () => {
  const baseDir = join(process.cwd(), 'tmp', 'testing-git-repo');
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
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
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
});

describe('branchHasChanges', () => {
  it('should return true if some changes are given', async () => {
    await makeStatusDirty();
    await expect(branchHasChanges()).resolves.toBe(true);
    await makeStatusClean();
  });
  it('should return false if no changes are given', async () => {
    await expect(branchHasChanges()).resolves.toBe(false);
  });
});

describe('guardAgainstDirtyRepo', () => {
  it('should throw if history is dirty', async () => {
    await makeStatusDirty();
    await expect(guardAgainstDirtyRepo()).rejects.toThrow(
      'Repository should be clean before we you can proceed',
    );
    await makeStatusClean();
  });
  it('should not throw if history is clean', async () => {
    await expect(guardAgainstDirtyRepo()).resolves.toEqual(void 0);
  });
});

describe('getCurrentBranchOrTag', () => {
  it('should log current branch', async () => {
    await expect(getCurrentBranchOrTag()).resolves.toEqual(expect.any(String));
  });
});

describe('safeCheckout', () => {
  let initialBranch: string = '';

  beforeAll(async () => {
    initialBranch = await getCurrentBranchOrTag();
  });

  afterEach(async () => {
    await git.checkout(initialBranch);
    await makeStatusClean();
  });

  it('should checkout target branch in clean state', async () => {
    await expect(safeCheckout('main')).resolves.toBe(void 0);
    await expect(getCurrentBranchOrTag()).resolves.toBe('main');
  });
  it('should throw if history is dirty', async () => {
    await makeStatusDirty();
    await expect(safeCheckout('main')).rejects.toThrow(
      'Repository should be clean before we you can proceed',
    );
  });

  it('should use gitRestore option', async () => {
    await makeStatusDirty();
    await expect(safeCheckout('main', {gitRestore: '.'})).resolves.toBeUndefined();
    await expect(getCurrentBranchOrTag()).resolves.toBe('main');
  });
});
