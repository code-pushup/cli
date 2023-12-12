import simpleGit from 'simple-git';

export type CommitData = {
  hash: string;
  message: string;
  author: string;
  date: string;
};

export interface GitTag {
  name: string;
  semver: string;
  date: string;
}

export const git = simpleGit();

export async function getLatestCommit() {
  // git log -1 --pretty=format:"%H %s %an %ad" // logs hash, message, author, date
  const log = await git.log({
    maxCount: 1,
    format: { hash: '%H', message: '%s', author: '%an', date: '%ad' },
  });
  return log?.latest;
}

export async function branchHasChanges(): Promise<boolean> {
  return await git.status(['-s']).then(r => Boolean(r.files.length));
}

export async function guardAgainstDirtyRepo(): Promise<void> {
  const isDirty = await branchHasChanges();
  if (isDirty) {
    throw new Error(`
        Repository should be clean before we you can proceed.
        Commit your local changes or stash them.
      `);
  }
}

export async function getCurrentBranchOrTag(): Promise<string> {
  return (
    (await git.branch().then(r => r.current)) ||
    // @TODO replace with simple git
    (await git.raw(['describe --tags --exact-match']).then(out => out.trim()))
  );
}
