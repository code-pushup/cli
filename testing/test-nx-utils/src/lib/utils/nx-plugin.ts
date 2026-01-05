import type { CreateNodesContextV2 } from '@nx/devkit';

export function createNodesV2Context(
  options?: Partial<CreateNodesContextV2>,
): CreateNodesContextV2 {
  const { workspaceRoot = process.cwd(), nxJsonConfiguration = {} } =
    options ?? {};
  return {
    workspaceRoot,
    nxJsonConfiguration,
  };
}
