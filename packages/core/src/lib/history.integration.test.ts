import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { getHashes } from './history';

describe('getHashes', () => {
  const baseDir = join(process.cwd(), 'tmp', 'core-history-git-test');
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
    const commits: string[] = [];
    beforeAll(async () => {
      await writeFile(join(baseDir, 'README.md'), '# hello-world\n');
      await gitMock.add('README.md');
      await gitMock.commit('Create README');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await gitMock.log()).latest!.hash);

      await writeFile(join(baseDir, 'README.md'), '# hello-world-1\n');
      await gitMock.add('README.md');
      await gitMock.commit('Update README 1');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await gitMock.log()).latest!.hash);

      await writeFile(join(baseDir, 'README.md'), '# hello-world-2\n');
      await gitMock.add('README.md');
      await gitMock.commit('Update README 2');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await gitMock.log()).latest!.hash);

      await gitMock.branch(['feature-branch']);
      await gitMock.checkout(['master']);
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
        getHashes({ from: commits.at(0) }, gitMock),
      ).resolves.toEqual([commits.at(-2), commits.at(-1)]);
    });

    it('getHashes should get commits from log based on "from" and "to"', async () => {
      await expect(
        getHashes({ from: commits.at(-1), to: commits.at(0) }, gitMock),
      ).resolves.toEqual([commits.at(-2), commits.at(-1)]);
    });

    it('getHashes should get commits from log based on "from" and "to" and "maxCount"', async () => {
      await expect(
        getHashes(
          { from: commits.at(-1), to: commits.at(0), maxCount: 1 },
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
