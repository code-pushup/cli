import { commentOnPR } from './comment.js';
import { logInfo } from './log.js';
import type { StandaloneRunResult } from './models.js';
import { type RunEnv, runOnProject } from './run-utils.js';

export async function runInStandaloneMode(
  env: RunEnv,
): Promise<StandaloneRunResult> {
  const { api, settings } = env;

  logInfo('Running Code PushUp in standalone project mode');

  const { files, newIssues } = await runOnProject(null, env);

  const commentMdPath = files.comparison?.md;
  if (!settings.skipComment && commentMdPath) {
    const commentId = await commentOnPR(commentMdPath, api, settings);
    return {
      mode: 'standalone',
      files,
      commentId,
      newIssues,
    };
  }
  return { mode: 'standalone', files, newIssues };
}
