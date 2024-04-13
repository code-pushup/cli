import {isAbsolute, join, relative} from 'node:path';
import {LogOptions, simpleGit, StatusResult} from 'simple-git';
import {Commit, commitSchema} from '@code-pushup/models';
import {ui} from './logging';
import {isSemver} from './semver';
import {toUnixPath} from './transform';

export async function getLatestCommit(
  git = simpleGit(),
): Promise<Commit | null> {
  const log = await git.log({
    maxCount: 1,
    // git log -1 --pretty=format:"%H %s %an %aI" - See: https://git-scm.com/docs/pretty-formats
    format: {hash: '%H', message: '%s', author: '%an', date: '%aI'},
  });
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

export class GitStatusError extends Error {
  static ignoredProps = new Set(['current', 'tracking']);

  static getReducedStatus(status: StatusResult) {
    return Object.fromEntries(
      Object.entries(status)
        .filter(([key]) => !this.ignoredProps.has(key))
        .filter(
          (
            entry: [
              string,
                number | string | boolean | null | undefined | unknown[],
            ],
          ) => {
            const value = entry[1];
            if (value == null) {
              return false;
            }
            if (Array.isArray(value) && value.length === 0) {
              return false;
            }
            if (typeof value === 'number' && value === 0) {
              return false;
            }
            return !(typeof value === 'boolean' && !value);
          },
        ),
    );
  }

  constructor(status: StatusResult) {
    super(
      `Working directory needs to be clean before we you can proceed. Commit your local changes or stash them: \n ${JSON.stringify(
        GitStatusError.getReducedStatus(status),
        null,
        2,
      )}`,
    );
  }
}

export async function guardAgainstLocalChanges(
  git = simpleGit(),
): Promise<void> {
  const status = await git.status(['-s']);
  if (status.files.length > 0) {
    throw new GitStatusError(status);
  }
}

export async function getCurrentBranchOrTag(
  git = simpleGit(),
): Promise<string> {
  return (
    (await git.branch().then(r => r.current)) ||
    // If no current branch, try to get the tag
    // @TODO use simple git
    (await git
      .raw(['describe', '--tags', '--exact-match'])
      .then(out => out.trim()))
  );
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

export type LogResult = { hash: string; message: string; tagName?: string };
export function filterLogs(allTags: string[], {from, to, maxCount}: Pick<LogOptions, 'from' | 'to' | 'maxCount'>) {
  const finIndex = (tagName: string = '', fallback: number | undefined = 0): number | undefined => isSemver(tagName) ? allTags.findIndex((tag) => tag === tagName) : fallback;
  return allTags.slice(finIndex(from), finIndex(to, undefined)).slice(0, maxCount);
}

export async function getSemverTags(
  {targetBranch, ...opt}: { targetBranch?: string; from?: string; maxCount?: number } = {},
  git = simpleGit(),
): Promise<LogResult[]> {
  // make sure we have a target branch
  let currentBranch;
  if (targetBranch) {
    currentBranch = await getCurrentBranchOrTag(git);
    // await git.checkout(targetBranch);
  } else {
    targetBranch = await getCurrentBranchOrTag(git);
  }

  // Fetch all tags merged into the target branch
  const tagsRaw = await git.tag(['--merged', targetBranch]);
  const allTags = tagsRaw
    .split('\n')
    .map(tag => tag.trim())
    .filter(Boolean)
    .filter(isSemver);

  const relevantTags = allTags; //filterLogs(allTags, opt)

  //ui().logger.info(JSON.stringify(allTags))
  const tagsWithHashes: LogResult[] = [];
  for (const tag of relevantTags) {
    const tagDetails = await git.show(['--no-patch', '--format=%H', tag]);
    const hash = tagDetails.trim(); // Remove quotes and trim whitespace
    tagsWithHashes.push({
      hash: hash?.split('\n').at(-1),
      message: tag,
    } as LogResult);
  }

  // Apply maxCount limit if specified
  return prepareHashes(tagsWithHashes);
}

/**
 * `getHashes` returns a list of commit hashes. Internally it uses `git.log()` to determine the commits within a range.
 * The amount can be limited to a maximum number of commits specified by `maxCount`.
 * With `from` and `to`, you can specify a range of commits.
 *
 * **NOTE:**
 * In Git, specifying a range with two dots (`from..to`) selects commits that are reachable from `to` but not from `from`.
 * Essentially, it shows the commits that are in `to` but not in `from`, excluding the commits unique to `from`.
 *
 * Example:
 *
 * Let's consider the following commit history:
 *
 *   A---B---C---D---E (main)
 *
 * Using `git log B..D`, you would get the commits C and D:
 *
 *   C---D
 *
 * This is because these commits are reachable from D but not from B.
 *
 * ASCII Representation:
 *
 *   Main Branch:    A---B---C---D---E
 *                       \       \
 *                        \       +--- Commits included in `git log B..D`
 *                         \
 *                          +--- Excluded by the `from` parameter
 *
 * With `simple-git`, when you specify a `from` and `to` range like this:
 *
 *   git.log({ from: 'B', to: 'D' });
 *
 * It interprets it similarly, selecting commits between B and D, inclusive of D but exclusive of B.
 * For `git.log({ from: 'B', to: 'D' })` or `git log B..D`, commits C and D are selected.
 *
 * @param options Object containing `from`, `to`, and optionally `maxCount` to specify the commit range and limit.
 * @param git The `simple-git` instance used to execute Git commands.
 */
export async function getHashes(
  options: LogOptions & { targetBranch?: string } = {},
  git = simpleGit(),
): Promise<LogResult[]> {
  const {targetBranch, from, to, maxCount, ...opt} = options;

  if (to && !from) {
    // throw more user-friendly error instead of:
    // fatal: ambiguous argument '...a': unknown revision or path not in the working tree.
    // Use '--' to separate paths from revisions, like this:
    // 'git <command> [<revision>...] -- [<file>...]'
    throw new Error(
      `git log command needs the "from" option defined to accept the "to" option.\n`,
    );
  }

  // Ensure you are on the correct branch
  let currentBranch;
  if (targetBranch) {
    currentBranch = await getCurrentBranchOrTag(git);
    await git.checkout(targetBranch);
  }

  const logs = await git.log({
    ...opt,
    format: {
      hash: '%H',
      message: '%s',
    },
    from,
    to,
    maxCount,
  });

  // Ensure you are back to the initial branch
  if (targetBranch) {
    await git.checkout(currentBranch as string);
  }

  return prepareHashes(Array.from(logs.all));
}

export function prepareHashes(
  logs: { hash: string; message: string }[],
): { hash: string; message: string }[] {
  return logs
    .map(({hash, message}) => ({hash, message}))
  // sort from oldest to newest @TODO => question this
  // .reverse();
}
