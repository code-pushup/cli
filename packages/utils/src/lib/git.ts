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

export function validateCommitData(
  commitData?: unknown,
  options: { throwError?: boolean } = {},
): commitData is CommitData {
  const { throwError = false } = options;
  if (!commitData) {
    const msg = 'no commit data available';
    if (throwError) {
      throw new Error(msg);
    } else {
      console.warn(msg);
      return false;
    }
  }
  return true;
}
