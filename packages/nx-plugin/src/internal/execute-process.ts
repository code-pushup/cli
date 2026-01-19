import type { ProcessConfig, ProcessResult } from '@code-pushup/utils';

/**
 * Dynamically imports and executes function from utils.
 *
 * This is a workaround for Nx only supporting plugins in CommonJS format.
 */
export async function executeProcess(
  cfg: ProcessConfig,
): Promise<ProcessResult> {
  const { executeProcess: executeProcessFromUtils } =
    await import('@code-pushup/utils');
  return executeProcessFromUtils(cfg);
}
