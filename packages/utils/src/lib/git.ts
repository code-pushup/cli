import simpleGit from 'simple-git';

export const git = simpleGit();

export async function latestHash() {
  const log = await git.log(['-1', '--pretty=format:"%H"']);
  if (!log.latest?.hash) {
    throw new Error('no latest hash present in git history.');
  }
  return log.latest?.hash;
}
