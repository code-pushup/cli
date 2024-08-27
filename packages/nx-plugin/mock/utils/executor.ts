import type { NormalizedExecutorContext } from '../../src/executors/internal/context';

export function normalizedExecutorContext(
  nameOrOpt: string | { projectName: string },
): NormalizedExecutorContext {
  const { projectName } =
    typeof nameOrOpt === 'string' ? { projectName: nameOrOpt } : nameOrOpt;
  return {
    projectName,
    workspaceRoot: 'workspaceRoot',
    projectConfig: {
      name: projectName,
      root: 'root',
    },
  };
}
