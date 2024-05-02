import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { addUpdateFile, emptyGitMock } from '@code-pushup/test-utils';
import {
  getCurrentBranchOrTag,
  getHashes,
  getLatestCommit,
  getSemverTags,
} from './git.commits-and-tags';

async function getAllCommits(git: SimpleGit) {
  return (await git.log()).all.map(({ hash, message }) => ({
    hash,
    message,
  }));
}

describe('getCurrentBranchOrTag', () => {
  const baseDir = join(process.cwd(), 'tmp', 'git-tests');
  let currentBranchOrTagGitMock: SimpleGit;

  beforeAll(async () => {
    currentBranchOrTagGitMock = await emptyGitMock(simpleGit, { baseDir });
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  describe('without a branch and commits', () => {
    it('getCurrentBranchOrTag should throw if no branch or tag is given', async () => {
      await expect(
        getCurrentBranchOrTag(currentBranchOrTagGitMock),
      ).rejects.toThrow('No names found, cannot describe anything');
    });
  });

  describe('with a branch and commits clean', () => {
    beforeAll(async () => {
      await addUpdateFile(currentBranchOrTagGitMock, {
        baseDir,
        commitMsg: 'init commit msg',
      });
      await currentBranchOrTagGitMock.checkout(['master']);
    });

    afterAll(async () => {
      await currentBranchOrTagGitMock.checkout(['master']);
    });

    it('getCurrentBranchOrTag should log current branch', async () => {
      await expect(
        getCurrentBranchOrTag(currentBranchOrTagGitMock),
      ).resolves.toBe('master');
    });
  });
});

describe('getLatestCommit', () => {
  const baseDir = join(process.cwd(), 'tmp', 'git', 'latest-commit');
  let emptyGit: SimpleGit;

  beforeAll(async () => {
    emptyGit = await emptyGitMock(simpleGit, { baseDir });
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  describe('with a branch and commits clean', () => {
    beforeAll(async () => {
      await addUpdateFile(emptyGit, { baseDir, commitMsg: 'Create README' });
      await emptyGit.checkout(['master']);
    });

    afterAll(async () => {
      await emptyGit.checkout(['master']);
    });

    it('should log latest commit', async () => {
      await expect(getLatestCommit(emptyGit)).resolves.toEqual({
        hash: expect.stringMatching(/^[\da-f]{40}$/),
        message: 'Create README',
        author: 'John Doe',
        date: expect.any(Date),
      });
    });
  });
});

describe('getHashes', () => {
  const baseDir = join(process.cwd(), 'tmp', 'utils-git-get-hashes');
  let gitMock: SimpleGit;

  beforeAll(async () => {
    gitMock = await emptyGitMock(simpleGit, { baseDir });
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  describe('without a branch and commits', () => {
    it('should throw', async () => {
      await expect(getHashes({}, gitMock)).rejects.toThrow(
        "your current branch 'master' does not have any commits yet",
      );
    });
  });

  describe('with a branch and commits clean', () => {
    let commits: { hash: string; message: string }[];
    beforeAll(async () => {
      await addUpdateFile(gitMock, { baseDir, commitMsg: 'Create README' });
      await addUpdateFile(gitMock, { baseDir, commitMsg: 'Update README 1' });
      await addUpdateFile(gitMock, { baseDir, commitMsg: 'Update README 2' });
      await addUpdateFile(gitMock, { baseDir, commitMsg: 'Update README 3' });
      commits = await getAllCommits(gitMock);

      await gitMock.checkout(['master']);
    });

    afterAll(async () => {
      await gitMock.checkout(['master']);
    });

    it('should get all commits from log if no option is passed', async () => {
      await expect(getHashes({}, gitMock)).resolves.toStrictEqual(commits);
    });

    it('should get last 2 commits from log if maxCount is set to 2', async () => {
      await expect(getHashes({ maxCount: 2 }, gitMock)).resolves.toStrictEqual([
        commits.at(0),
        commits.at(1),
      ]);
    });

    it('should get commits from log based on "from"', async () => {
      await expect(
        getHashes({ from: commits.at(-1)?.hash }, gitMock),
      ).resolves.toEqual([commits.at(0), commits.at(1), commits.at(2)]);
    });

    it('should get commits from log based on "from" and "to"', async () => {
      await expect(
        getHashes(
          { from: commits.at(-1)?.hash, to: commits.at(1)?.hash },
          gitMock,
        ),
      ).resolves.toEqual([commits.at(1), commits.at(2)]);
    });

    it('should get commits from log based on "from" and "to" and "maxCount"', async () => {
      await expect(
        getHashes(
          { from: commits.at(-1)?.hash, to: commits.at(1)?.hash, maxCount: 1 },
          gitMock,
        ),
      ).resolves.toEqual([commits.at(1)]);
    });

    it('should throw if "from" is undefined but "to" is defined', async () => {
      await expect(
        getHashes({ from: undefined, to: 'a' }, gitMock),
      ).rejects.toThrow(
        'filter needs the "from" option defined to accept the "to" option.',
      );
    });
  });
});

describe('getSemverTags', () => {
  const baseDir = join(process.cwd(), 'tmp', 'git', 'get-semver-tags');
  let gitSemverTagsMock: SimpleGit;

  beforeAll(async () => {
    await mkdir(baseDir, { recursive: true });
    gitSemverTagsMock = await emptyGitMock(simpleGit, { baseDir });
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  describe('without a branch and commits', () => {
    it('should list no tags on a branch with no tags', async () => {
      await expect(getSemverTags({}, gitSemverTagsMock)).rejects.toMatch(
        /No names found/,
      );
    });
  });

  describe('with a branch and only commits clean', () => {
    beforeAll(async () => {
      await addUpdateFile(gitSemverTagsMock, {
        baseDir,
        commitMsg: 'Create README',
      });
      await gitSemverTagsMock.checkout(['master']);
    });

    afterAll(async () => {
      await gitSemverTagsMock.checkout(['master']);
    });

    it('should list no tags on a branch with no tags', async () => {
      await expect(getSemverTags({}, gitSemverTagsMock)).resolves.toStrictEqual(
        [],
      );
    });
  });

  describe('with a branch and tagged commits clean', () => {
    beforeAll(async () => {
      await gitSemverTagsMock.checkout(['master']);
      await addUpdateFile(gitSemverTagsMock, {
        baseDir,
        commitMsg: 'Create README',
      });

      await addUpdateFile(gitSemverTagsMock, {
        baseDir,
        commitMsg: 'release v1',
        tagName: '1.0.0',
      });

      await gitSemverTagsMock.checkout(['master']);
    });

    afterAll(async () => {
      await gitSemverTagsMock.checkout(['master']);
    });

    it('should list all tags on the branch', async () => {
      await expect(getSemverTags({}, gitSemverTagsMock)).resolves.toStrictEqual(
        [
          {
            hash: expect.any(String),
            message: '1.0.0',
          },
        ],
      );
    });
  });
});
