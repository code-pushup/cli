/**
 * Dynamically imports and executes function from utils.
 *
 * This is a workaround for Nx only supporting plugins in CommonJS format.
 */
export async function executeProcess(
  cfg: import('@code-pushup/utils').ProcessConfig,
): Promise<import('@code-pushup/utils').ProcessResult> {
  const { executeProcess } = await import('@code-pushup/utils');
  return executeProcess(cfg);
}
