import { commentOnPR } from './comment.js';
import type { StandaloneRunResult } from './models.js';
import { type RunEnv, runOnProject } from './run-utils.js';

export async function runInStandaloneMode(
  env: RunEnv,
): Promise<StandaloneRunResult> {
  const {
    api,
    settings: { logger },
  } = env;

  logger.info('Running Code PushUp in standalone project mode');

  const { files, newIssues } = await runOnProject(null, env);

  const commentMdPath = files.diff?.md;
  if (commentMdPath) {
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
