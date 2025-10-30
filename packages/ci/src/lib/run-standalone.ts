import { logger } from '@code-pushup/utils';
import { commentOnPR } from './comment.js';
import type { StandaloneRunResult } from './models.js';
import { type RunEnv, runOnProject } from './run-utils.js';

export async function runInStandaloneMode(
  env: RunEnv,
): Promise<StandaloneRunResult> {
  const { api, settings } = env;

  logger.info('Running Code PushUp in standalone project mode');

  const { files, newIssues } = await runOnProject(null, env);

  const commentMdPath = files.comparison?.md;
  if (!settings.skipComment && commentMdPath) {
    const commentId = await commentOnPR(commentMdPath, api);
    return {
      mode: 'standalone',
      files,
      commentId,
      newIssues,
    };
  }
  return { mode: 'standalone', files, newIssues };
}
