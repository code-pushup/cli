import { isAbsolute, join, relative } from 'node:path';
import { StatusResult, simpleGit } from 'simple-git';
import { ui } from '../logging';
import { toUnixPath } from '../transform';

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
