import type { SimpleGit } from 'simple-git';
import { simpleGit } from 'simple-git';
import type {
  GitRefs,
  Options,
  ProviderAPIClient,
  RunResult,
} from './models.js';
import { runInMonorepoMode } from './run-monorepo.js';
import { runInStandaloneMode } from './run-standalone.js';
import { createRunEnv } from './run-utils.js';

/**
 * Runs Code PushUp in CI environment.
 * @param refs Git branches (head and optional base)
 * @param api API client for given provider
 * @param options Additional options (e.g. monorepo mode)
 * @param git instance of simple-git - useful for testing
 * @returns result of run (standalone or monorepo)
 */
export async function runInCI(
  refs: GitRefs,
  api: ProviderAPIClient,
  options?: Options,
  git: SimpleGit = simpleGit(),
): Promise<RunResult> {
  const env = await createRunEnv(refs, api, options, git);

  if (env.settings.monorepo) {
    return runInMonorepoMode(env);
  }

  return runInStandaloneMode(env);
}
