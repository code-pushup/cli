import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import {afterAll, beforeAll, beforeEach, describe, expect} from 'vitest';
import {
  getCurrentBranchOrTag,
  getGitRoot,
  getHashes,
  getLatestCommit,
  getSemverTags,
  guardAgainstLocalChanges, prepareHashes,
  safeCheckout,
  toGitPath,
} from './git';
import { toUnixPath } from './transform';

describe('git utils in a git repo', () => {
  const baseDir = join(process.cwd(), 'tmp', 'git-tests');
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
        'No names found, cannot describe anything',
      );
    });

    it('getGitRoot should return git root in a set up repo', async () => {
      await expect(getGitRoot(emptyGit)).resolves.toMatch(/tmp\/git-tests$/);
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
      ).resolves.toBe('../../Backend/API/Startup.cs');
    });

    it('should keep relative Unix path as is (already a Git path)', async () => {
      await expect(toGitPath('Backend/API/Startup.cs', emptyGit)).resolves.toBe(
        '../../Backend/API/Startup.cs',
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


describe('getHashes', () => {
  const baseDir = join(process.cwd(), 'tmp', 'utils-git-get-hashes');
  let gitMock: SimpleGit;

  beforeAll(async () => {
    await mkdir(baseDir, { recursive: true });
    gitMock = simpleGit(baseDir);
    await gitMock.init();
    await gitMock.addConfig('user.name', 'John Doe');
    await gitMock.addConfig('user.email', 'john.doe@example.com');
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
    let commits: { hash: string, message: string }[] = [];
    beforeAll(async () => {
      await writeFile(join(baseDir, 'README.md'), '# hello-world\n');
      await gitMock.add('README.md');
      await gitMock.commit('Create README');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await gitMock.log()).latest as { hash: string, message: string });

      await writeFile(join(baseDir, 'README.md'), '# hello-world-1\n');
      await gitMock.add('README.md');
      await gitMock.commit('Update README 1');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await gitMock.log()).latest as { hash: string, message: string });

      await writeFile(join(baseDir, 'README.md'), '# hello-world-2\n');
      await gitMock.add('README.md');
      await gitMock.commit('Update README 2');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await gitMock.log()).latest as { hash: string, message: string });

      await gitMock.branch(['feature-branch']);
      await gitMock.checkout(['master']);
      commits = commits.map(({hash, message}) => ({hash, message}));
    });

    afterAll(async () => {
      await gitMock.checkout(['master']);
      await gitMock.deleteLocalBranch('feature-branch');
    });

    it('getHashes should get all commits from log if no option is passed', async () => {
      await expect(getHashes({}, gitMock)).resolves.toStrictEqual(commits);
    });

    it('getHashes should get last 2 commits from log if maxCount is set to 2', async () => {
      await expect(getHashes({ maxCount: 2 }, gitMock)).resolves.toStrictEqual([
        commits.at(-2),
        commits.at(-1),
      ]);
    });

    it('getHashes should get commits from log based on "from"', async () => {
      await expect(
        getHashes({ from: commits.at(0)?.hash }, gitMock),
      ).resolves.toEqual([commits.at(-2), commits.at(-1)]);
    });

    it('getHashes should get commits from log based on "from" and "to"', async () => {
      await expect(
        getHashes({ from: commits.at(-1)?.hash, to: commits.at(0)?.hash }, gitMock),
      ).resolves.toEqual([commits.at(-2), commits.at(-1)]);
    });

    it('getHashes should get commits from log based on "from" and "to" and "maxCount"', async () => {
      await expect(
        getHashes(
          { from: commits.at(-1)?.hash, to: commits.at(0)?.hash, maxCount: 1 },
          gitMock,
        ),
      ).resolves.toEqual([commits.at(-1)]);
    });

    it('getHashes should throw if "from" is undefined but "to" is defined', async () => {
      await expect(
        getHashes({ from: undefined, to: 'a' }, gitMock),
      ).rejects.toThrow(
        'git log command needs the "from" option defined to accept the "to" option.',
      );
    });
  });
});


describe('getSemverTags', () => {
  const baseDir = join(process.cwd(), 'tmp', 'utils-git-get-semver-tags');
  let gitMock: SimpleGit;

  beforeAll(async () => {
    await mkdir(baseDir, { recursive: true });
    gitMock = simpleGit(baseDir);
    await gitMock.init();
    await gitMock.addConfig('user.name', 'John Doe');
    await gitMock.addConfig('user.email', 'john.doe@example.com');
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  describe('without a branch and commits', () => {
    it('should throw', async () => {
      await expect(getSemverTags({}, gitMock)).rejects.toThrow(
        "your current branch 'master' does not have any commits yet",
      );
    });


    it('should list no tags on a branch with no tags', async () => {
      await expect(getSemverTags({}, gitMock)).resolves.toStrictEqual([]);
    });
  });

  describe('with a branch and commits clean', () => {
    let commits: { hash: string, message: string }[] = [];
    beforeAll(async () => {
      await writeFile(join(baseDir, 'README.md'), '# hello-world\n');
      await gitMock.add('README.md');
      await gitMock.commit('Create README');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await gitMock.log()).latest as { hash: string, message: string });

      await writeFile(join(baseDir, 'README.md'), '# hello-world-1\n');
      await gitMock.add('README.md');
      await gitMock.commit('Update README 1');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await gitMock.log()).latest as { hash: string, message: string });

      await writeFile(join(baseDir, 'README.md'), '# hello-world-2\n');
      await gitMock.add('README.md');
      await gitMock.commit('Update README 2');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await gitMock.log()).latest as { hash: string, message: string });

      await gitMock.branch(['feature-branch']);
      await gitMock.checkout(['master']);
      commits = commits.map(({hash, message}) => ({hash, message}));
    });

    afterAll(async () => {
      await gitMock.checkout(['master']);
      await gitMock.deleteLocalBranch('feature-branch');
    });
    it('should list all tags on the branch', async () => {
      await expect(getSemverTags({}, emptyGit)).resolves.toStrictEqual([
        {
          hash: expect.any(String),
          message: 'v1.0.0',
        },
        {
          hash: expect.any(String),
          message: 'core@1.0.2',
        },
        {
          hash: expect.any(String),
          message: '1.0.1',
        },
      ]);
    });
    it('should get all commits from log if no option is passed', async () => {
      await expect(getSemverTags({}, gitMock)).resolves.toStrictEqual(commits);
    });

    it('should get last 2 commits from log if maxCount is set to 2', async () => {
      await expect(getSemverTags({ maxCount: 2 }, gitMock)).resolves.toStrictEqual([
        commits.at(-2),
        commits.at(-1),
      ]);
    });

    it('should get commits from log based on "from"', async () => {
      await expect(
        getSemverTags({ from: commits.at(0)?.hash }, gitMock),
      ).resolves.toEqual([commits.at(-2), commits.at(-1)]);
    });

    it('should get commits from log based on "from" and "to"', async () => {
      await expect(
        getSemverTags({ from: commits.at(-1)?.hash, to: commits.at(0)?.hash }, gitMock),
      ).resolves.toEqual([commits.at(-2), commits.at(-1)]);
    });

    it('should get commits from log based on "from" and "to" and "maxCount"', async () => {
      await expect(
        getSemverTags(
          { from: commits.at(-1)?.hash, to: commits.at(0)?.hash, maxCount: 1 },
          gitMock,
        ),
      ).resolves.toEqual([commits.at(-1)]);
    });

    it('should throw if "from" is undefined but "to" is defined', async () => {
      await expect(
        getSemverTags({ from: undefined, to: 'a' }, gitMock),
      ).rejects.toThrow(
        'git log command needs the "from" option defined to accept the "to" option.',
      );
    });
  });
});
