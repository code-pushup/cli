import { cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type FetchResult,
  type Response,
  type SimpleGit,
  simpleGit,
} from 'simple-git';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  initGitRepo,
} from '@code-pushup/test-utils';

export type TestRepo = Awaited<ReturnType<typeof setupTestRepo>>;

export async function setupTestRepo(folder: string) {
  const fixturesDir = join(
    fileURLToPath(dirname(import.meta.url)),
    'fixtures',
    folder,
  );
  const baseDir = join(
    process.cwd(),
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    folder,
  );
  const outputDir = join(baseDir, '.code-pushup');

  await cp(fixturesDir, baseDir, { recursive: true });

  const git = await initGitRepo(simpleGit, { baseDir });
  await simulateGitFetch(git);

  await git.add('.');
  await git.commit('Initial commit');

  return {
    git,
    baseDir,
    outputDir,
    cleanup: () => teardownTestFolder(baseDir),
  };
}

// git fetch and FETCH_HEAD must be simulated because of missing remote
async function simulateGitFetch(git: SimpleGit) {
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
