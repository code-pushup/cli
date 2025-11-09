import { cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { simpleGit } from 'simple-git';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  NX_IGNORED_FILES_TO_RESTORE,
  TEST_OUTPUT_DIR,
  initGitRepo,
  restoreRenamedFiles,
  simulateGitFetch,
  teardownTestFolder,
} from '@code-pushup/test-utils';

export type TestRepo = Awaited<ReturnType<typeof setupTestRepo>>;

export async function setupTestRepo(folder: string) {
  const fixturesDir = path.join(
    fileURLToPath(path.dirname(import.meta.url)),
    'fixtures',
    folder,
  );
  const baseDir = path.join(
    process.cwd(),
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    folder,
  );

  await cp(fixturesDir, baseDir, { recursive: true });
  await restoreRenamedFiles(baseDir, NX_IGNORED_FILES_TO_RESTORE);

  const git = await initGitRepo(simpleGit, { baseDir });
  await simulateGitFetch(git);

  await git.add('.');
  await git.commit('Initial commit');

  return {
    git,
    baseDir,
    cleanup: () => teardownTestFolder(baseDir),
  };
}
