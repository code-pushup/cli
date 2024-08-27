import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SimpleGit, SimpleGitFactory } from 'simple-git';

export type GitConfig = { name: string; email: string };

export async function emptyGitMock(
  git: SimpleGitFactory,
  opt: { baseDir: string; config?: GitConfig },
): Promise<SimpleGit> {
  const { baseDir, config } = opt;
  const { email = 'john.doe@example.com', name = 'John Doe' } = config ?? {};
  await mkdir(baseDir, { recursive: true });
  const emptyGit = git(baseDir);
  await emptyGit.init();
  await emptyGit.addConfig('user.name', name);
  await emptyGit.addConfig('user.email', email);
  return emptyGit;
}

export async function addBranch(
  git: SimpleGit,
  branchName = 'master',
): Promise<SimpleGit> {
  await git.branch([branchName]);
  return git;
}

export async function addUpdateFile(
  git: SimpleGit,
  opt?: {
    file?: { name?: string; content?: string };
    baseDir?: string;
    commitMsg?: string;
    tagName?: string;
  },
): Promise<SimpleGit> {
  const {
    file,
    baseDir = '',
    commitMsg = 'Create README',
    tagName,
  } = opt ?? {};
  const { name = 'README.md', content = `# hello-world-${Math.random()}` } =
    file ?? {};
  await writeFile(join(baseDir, name), content);
  await git.add(name);
  if (tagName) {
    await git.tag([tagName]);
  }
  if (commitMsg) {
    await git.commit(commitMsg);
  }
  return git;
}
