import { isAbsolute, join, relative } from 'node:path';
import { simpleGit } from 'simple-git';
import { toUnixPath } from './transform';

export type CommitData = {
  hash: string;
  message: string;
  author: string;
  date: string;
};

export async function getLatestCommit(git = simpleGit()) {
  // git log -1 --pretty=format:"%H %s %an %ad" // logs hash, message, author, date
  const log = await git.log({
    maxCount: 1,
    format: { hash: '%H', message: '%s', author: '%an', date: '%ad' },
  });
  return log.latest satisfies CommitData | null;
}

export function getGitRoot(git = simpleGit()): Promise<string> {
  return git.revparse('--show-toplevel');
}

export function formatGitPath(path: string, gitRoot: string): string {
  const absolutePath = isAbsolute(path) ? path : join(process.cwd(), path);
  const relativePath = relative(gitRoot, absolutePath);
  return toUnixPath(relativePath);
}

export async function toGitPath(
  path: string,
  git = simpleGit(),
): Promise<string> {
  const gitRoot = await getGitRoot(git);
  return formatGitPath(path, gitRoot);
}

export function validateCommitData(
  commitData: CommitData | null,
  options: { throwError?: true } = {},
): commitData is CommitData {
  if (!commitData) {
    const msg = 'no commit data available';
    if (options?.throwError) {
      throw new Error(msg);
    } else {
      // @TODO replace with ui().logger.warning
      console.warn(msg);
      return false;
    }
  }
  return true;
}

export function statusIsClean(git = simpleGit()): Promise<boolean> {
  return git.status(['-s']).then(r => r.files.length === 0);
}

export async function guardAgainstLocalChanges(
  git = simpleGit(),
): Promise<void> {
  const isClean = await statusIsClean(git);
  if (!isClean) {
    throw new Error(
      'Working directory needs to be clean before we you can proceed. Commit your local changes or stash them.',
    );
  }
}

export async function getCurrentBranchOrTag(
  git = simpleGit(),
): Promise<string> {
  return (
    (await git.branch().then(r => r.current)) ||
    // @TODO replace with simple git
    (await git.raw(['describe --tags --exact-match']).then(out => out.trim()))
  );
}

export async function safeCheckout(
  branchOrHash: string,
  options: {
    reset?: true;
  } = {},
  git = simpleGit(),
): Promise<void> {
  // git requires a clean history to check out a branch
  if (options?.reset) {
    await git.raw(['reset', '--hard']);
    // @TODO replace with ui().logger.info
    console.info(`branch cleaned`);
  }
  await guardAgainstLocalChanges(git);
  await git.checkout(branchOrHash);
}
