import { type LogOptions as SimpleGitLogOptions, simpleGit } from 'simple-git';
import { type Commit, commitSchema } from '@code-pushup/models';
import { isSemver } from '../semver.js';

export async function getLatestCommit(
  git = simpleGit(),
): Promise<Commit | null> {
  const log = await git.log({
    maxCount: 1,
    // git log -1 --pretty=format:"%H %s %an %aI" - See: https://git-scm.com/docs/pretty-formats
    format: { hash: '%H', message: '%s', author: '%an', date: '%aI' },
  });
  return commitSchema.parse(log.latest);
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

export type LogResult = { hash: string; message: string };

function validateFilter({ from, to }: LogOptions) {
  if (to && !from) {
    // throw more user-friendly error instead of:
    // fatal: ambiguous argument '...a': unknown revision or path not in the working tree.
    // Use '--' to separate paths from revisions, like this:
    // 'git <command> [<revision>...] -- [<file>...]'
    throw new Error(
      `filter needs the "from" option defined to accept the "to" option.\n`,
    );
  }
}

export function filterLogs(
  allTags: string[],
  opt?: Pick<LogOptions, 'from' | 'to' | 'maxCount'>,
) {
  if (!opt) {
    return allTags;
  }
  validateFilter(opt);
  const { from, to, maxCount } = opt;
  const finIndex = <T>(tagName?: string, fallback?: T) => {
    const idx = allTags.indexOf(tagName ?? '');
    if (idx > -1) {
      return idx;
    }
    return fallback;
  };
  const fromIndex = finIndex(from, 0);
  const toIndex = finIndex(to, undefined);
  return allTags
    .slice(fromIndex, toIndex ? toIndex + 1 : toIndex)
    .slice(0, maxCount ?? undefined);
}

export async function getHashFromTag(
  tag: string,
  git = simpleGit(),
): Promise<LogResult> {
  const tagDetails = await git.show(['--no-patch', '--format=%H', tag]);
  const hash = tagDetails.trim(); // Remove quotes and trim whitespace
  return {
    hash: hash.split('\n').at(-1) ?? '',
    message: tag,
  };
}

export type LogOptions = {
  targetBranch?: string;
  from?: string;
  to?: string;
  maxCount?: number;
};

export async function getSemverTags(
  opt: LogOptions = {},
  git = simpleGit(),
): Promise<LogResult[]> {
  validateFilter(opt);
  const { targetBranch, ...options } = opt;
  // make sure we have a target branch
  // eslint-disable-next-line functional/no-let
  let currentBranch;
  if (targetBranch) {
    currentBranch = await getCurrentBranchOrTag(git);
    await git.checkout(targetBranch);
  }

  // Fetch all tags merged into the target branch
  const tagsRaw = await git.tag([
    '--merged',
    targetBranch ?? (await getCurrentBranchOrTag(git)),
  ]);

  const allTags = tagsRaw
    .split(/\n/)
    .map(tag => tag.trim())
    .filter(Boolean)
    .filter(isSemver);

  const relevantTags = filterLogs(allTags, options);

  const tagsWithHashes: LogResult[] = await Promise.all(
    relevantTags.map(tag => getHashFromTag(tag, git)),
  );

  if (currentBranch) {
    await git.checkout(currentBranch);
  }

  return tagsWithHashes;
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
  options: SimpleGitLogOptions & Pick<LogOptions, 'targetBranch'> = {},
  git = simpleGit(),
): Promise<LogResult[]> {
  const { targetBranch, from, to, maxCount, ...opt } = options;

  validateFilter({ from, to });

  // Ensure you are on the correct branch
  // eslint-disable-next-line functional/no-let
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

  return [...logs.all];
}
