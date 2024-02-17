import { isAbsolute, join, relative } from 'node:path';
import { simpleGit } from 'simple-git';
import { ui } from './logging';
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
  options: { throwError?: boolean } = {},
): commitData is CommitData {
  const { throwError = false } = options;
  if (!commitData) {
    const msg = 'no commit data available';
    if (throwError) {
      throw new Error(msg);
    } else {
      ui().logger.warning(msg);
      return false;
    }
  }
  return true;
}
