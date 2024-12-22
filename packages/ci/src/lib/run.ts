import { type SimpleGit, simpleGit } from 'simple-git';
import { DEFAULT_SETTINGS } from './constants.js';
import type {
  GitRefs,
  Options,
  ProviderAPIClient,
  RunResult,
  Settings,
} from './models.js';
import { runInMonorepoMode } from './run-monorepo.js';
import { runInStandaloneMode } from './run-standalone.js';
import type { RunEnv } from './run-utils.js';

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
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...options,
  };

  const env: RunEnv = { refs, api, settings, git };

  if (settings.monorepo) {
    return runInMonorepoMode(env);
  }

  return runInStandaloneMode(env);
}
