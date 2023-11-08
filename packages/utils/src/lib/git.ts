import simpleGit from 'simple-git';

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
  return log?.latest;
}
