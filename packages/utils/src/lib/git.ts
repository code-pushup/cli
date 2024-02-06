import { simpleGit } from 'simple-git';

export type CommitData = {
  hash: string;
  message: string;
  author: string;
  date: string;
};

export const git = simpleGit();

export async function getLatestCommit() {
  // git log -1 --pretty=format:"%H %s %an %ad" // logs hash, message, author, date
  const log = await git.log({
    maxCount: 1,
    format: { hash: '%H', message: '%s', author: '%an', date: '%ad' },
  });
  return log.latest;
}

export function branchHasChanges(): Promise<boolean> {
  return git.status(['-s']).then(r => r.files.length > 0);
}

export async function guardAgainstLocalChanges(): Promise<void> {
  const isDirty = await branchHasChanges();
  if (isDirty) {
    throw new Error('Repository should be clean before we you can proceed. Commit your local changes or stash them.');
  }
}

export async function getCurrentBranchOrTag(): Promise<string> {
  return (
    (await git.branch().then(r => r.current)) ||
    // @TODO replace with simple git
    (await git.raw(['describe --tags --exact-match']).then(out => out.trim()))
  );
}

export async function safeCheckout(
  branchOrHash: string,
  options: {
    clean?: boolean;
  } = {},
): Promise<void> {
  // git requires a clean history to check out a branch
  if (options?.clean) {
    await git.clean(['f']);
    console.info(`branch cleaned`);
  }
  await guardAgainstDirtyRepo();
  await git.checkout(branchOrHash);
}
