import type { CreateNodesContext } from '@nx/devkit';

export function createNodesContext(
  options?: Partial<CreateNodesContext>,
): CreateNodesContext {
  const { workspaceRoot = process.cwd(), nxJsonConfiguration = {} } =
    options ?? {};
  return {
    workspaceRoot,
    nxJsonConfiguration,
  };
}
