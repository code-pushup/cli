import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { getHashes } from './history';

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
    it('getHashes should throw', async () => {
      await expect(getHashes({}, emptyGit)).rejects.toThrow(
        "your current branch 'master' does not have any commits yet",
      );
    });
  });

  describe('with a branch and commits clean', () => {
    const commits: string[] = [];
    beforeAll(async () => {
      await writeFile(join(baseDir, 'README.md'), '# hello-world\n');
      await emptyGit.add('README.md');
      await emptyGit.commit('Create README');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await emptyGit.log()).latest?.hash);

      await writeFile(join(baseDir, 'README.md'), '# hello-world-1\n');
      await emptyGit.add('README.md');
      await emptyGit.commit('Update README 1');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await emptyGit.log()).latest?.hash);

      await writeFile(join(baseDir, 'README.md'), '# hello-world-2\n');
      await emptyGit.add('README.md');
      await emptyGit.commit('Update README 2');
      // eslint-disable-next-line functional/immutable-data
      commits.push((await emptyGit.log()).latest?.hash);

      await emptyGit.branch(['feature-branch']);
      await emptyGit.checkout(['master']);
    });

    afterAll(async () => {
      await emptyGit.checkout(['master']);
      await emptyGit.deleteLocalBranch('feature-branch');
    });

    it('getHashes should get all commits from log if no option is passed', async () => {
      await expect(getHashes({}, emptyGit)).resolves.toStrictEqual(commits);
    });

    it('getHashes should get last 2 commits from log if maxCount is set to 2', async () => {
      await expect(getHashes({ maxCount: 2 }, emptyGit)).resolves.toStrictEqual(
        [commits[1], commits[2]],
      );
    });

    it('getHashes should get commits from log based on "from" and "to"', async () => {
      await expect(
        getHashes({ from: commits[2], to: commits[0] }, emptyGit),
      ).resolves.toEqual([commits[1], commits[2]]);
    });

    it('getHashes should get commits from log based on "from" and "to" and "maxCount"', async () => {
      await expect(
        getHashes({ from: commits[2], to: commits[0], maxCount: 1 }, emptyGit),
      ).resolves.toEqual([commits[2]]);
    });

    it('getHashes should throw if "from" or "to" are invalid', async () => {
      await expect(
        getHashes({ from: undefined, to: 'a' }, emptyGit),
      ).rejects.toThrow('from has to be defined');
      await expect(
        getHashes({ from: 'a', to: undefined }, emptyGit),
      ).rejects.toThrow('to has to be defined');
    });
  });
});
