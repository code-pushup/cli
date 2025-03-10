import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  FetchResult,
  Response,
  SimpleGit,
  SimpleGitFactory,
} from 'simple-git';
import { vi } from 'vitest';

export type GitConfig = { name: string; email: string };
export async function initGitRepo(
  simpleGit: SimpleGitFactory,
  opt: {
    baseDir: string;
    config?: GitConfig;
    baseBranch?: string;
  },
): Promise<SimpleGit> {
  const { baseDir, config, baseBranch } = opt;
  const { email = 'john.doe@example.com', name = 'John Doe' } = config ?? {};
  await mkdir(baseDir, { recursive: true });
  const git = simpleGit(baseDir);
  await git.init();
  await git.addConfig('user.name', name);
  await git.addConfig('user.email', email);
  await git.addConfig('commit.gpgSign', 'false');
  await git.addConfig('tag.gpgSign', 'false');
  await git.branch(['-M', baseBranch ?? 'main']);
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
  await writeFile(path.join(baseDir, name), content);
  await git.add(name);
  if (tagName) {
    await git.tag([tagName]);
  }
  if (commitMsg) {
    await git.commit(commitMsg);
  }
  return git;
}

export async function simulateGitFetch(git: SimpleGit) {
  let fetchHead: string = await git.branchLocal().then(resp => resp.current);

  vi.spyOn(git, 'fetch').mockImplementation((...args) => {
    fetchHead = (args as unknown as [string, string, string[]])[1];
    return Promise.resolve({}) as Response<FetchResult>;
  });

  const originalDiffSummary = git.diffSummary.bind(git);
  const originalDiff = git.diff.bind(git);

  vi.spyOn(git, 'diffSummary').mockImplementation(args =>
    originalDiffSummary(
      (args as unknown as string[]).map(arg =>
        arg === 'FETCH_HEAD' ? fetchHead : arg,
      ),
    ),
  );
  vi.spyOn(git, 'diff').mockImplementation(args =>
    originalDiff(
      (args as string[]).map(arg => (arg === 'FETCH_HEAD' ? fetchHead : arg)),
    ),
  );
}
