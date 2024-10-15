import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SimpleGit, SimpleGitFactory } from 'simple-git';

export type GitConfig = { name: string; email: string };

export async function initGitRepo(
  simpleGit: SimpleGitFactory,
  opt: { baseDir: string; config?: GitConfig },
): Promise<SimpleGit> {
  const { baseDir, config } = opt;
  const { email = 'john.doe@example.com', name = 'John Doe' } = config ?? {};
  await mkdir(baseDir, { recursive: true });
  const git = simpleGit(baseDir);
  await git.init();
  await git.addConfig('user.name', name);
  await git.addConfig('user.email', email);
  await git.branch(['-M', 'main']);
  return git;
}

export async function commitFile(
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
  const { name = 'README.md', content = `# hello-world-${Math.random()}\n` } =
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
