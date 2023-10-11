import simpleGit from 'simple-git';

export const git = simpleGit();

export async function latestHash() {
  // git log -1 --pretty=format:"%H" // logs hash e.g. 41682a2fec1d4ece81c696a26c08984baeb4bcf3
  const log = await git.log({ maxCount: 1, format: { hash: '%H' } });
  if (!log?.latest?.hash) {
    throw new Error('no latest hash present in git history.');
  }
  return log?.latest?.hash;
}
