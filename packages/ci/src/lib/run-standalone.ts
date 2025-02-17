import { commentOnPR } from './comment.js';
import type { StandaloneRunResult } from './models.js';
import { type RunEnv, ensureHeadBranch, runOnProject } from './run-utils.js';

export async function runInStandaloneMode(
  env: RunEnv,
): Promise<StandaloneRunResult> {
  const { api, settings } = env;
  const { logger } = settings;

  logger.info('Running Code PushUp in standalone project mode');

  await ensureHeadBranch(env);

  const { files, newIssues } = await runOnProject(null, env);

  const commentMdPath = files.diff?.md;
  if (!settings.skipComment && commentMdPath) {
    const commentId = await commentOnPR(commentMdPath, api, logger);
    return {
      mode: 'standalone',
      files,
      commentId,
      newIssues,
    };
  }
  return { mode: 'standalone', files, newIssues };
}
