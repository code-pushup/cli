import type { CreateNodesContext } from '@nx/devkit';

export function createNodesContext(
  options?: Partial<CreateNodesContextV2>,
): CreateNodesContextV2 {
  const { workspaceRoot = process.cwd(), nxJsonConfiguration = {} } =
    options ?? {};
  return {
    workspaceRoot,
    nxJsonConfiguration,
  };
}
