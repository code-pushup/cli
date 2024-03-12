import { isAbsolute, join, relative } from 'node:path';
import { simpleGit } from 'simple-git';
import { Commit, commitSchema } from '@code-pushup/models';
import { ui } from './logging';
import { toUnixPath } from './transform';

export async function getLatestCommit(
  git = simpleGit(),
): Promise<Commit | null> {
  // git log -1 --pretty=format:"%H %s %an %aI"
  // https://git-scm.com/docs/pretty-formats
  const log = await git.log({
    maxCount: 1,
    format: { hash: '%H', message: '%s', author: '%an', date: '%aI' },
  });
  if (!log.latest) {
    return null;
  }
  return commitSchema.parse(log.latest);
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

export async function guardAgainstLocalChanges(
  git = simpleGit(),
): Promise<void> {
  const isClean = await git.status(['-s']).then(r => r.files.length === 0);
  if (!isClean) {
    throw new Error(
      'Working directory needs to be clean before we you can proceed. Commit your local changes or stash them.',
    );
  }
}

export async function getCurrentBranchOrTag(
  git = simpleGit(),
): Promise<string> {
  try {
    const branch = await git.branch().then(r => r.current);
    // eslint-disable-next-line unicorn/prefer-ternary
    if (branch) {
      return branch;
    } else {
      // If no current branch, try to get the tag
      // @TODO use simple git
      return await git
        .raw(['describe', '--tags', '--exact-match'])
        .then(out => out.trim());
    }
  } catch {
    // Return a custom error message when something goes wrong
    throw new Error('Could not get current tag or branch.');
  }
}

export async function safeCheckout(
  branchOrHash: string,
  forceCleanStatus = false,
  git = simpleGit(),
): Promise<void> {
  // git requires a clean history to check out a branch
  if (forceCleanStatus) {
    await git.raw(['reset', '--hard']);
    await git.clean(['f', 'd']);
    ui().logger.info(`git status cleaned`);
  }
  await guardAgainstLocalChanges(git);
  await git.checkout(branchOrHash);
}
