import { CreateNodes, CreateNodesContext, CreateNodesResult } from '@nx/devkit';
import { vol } from 'memfs';
import { MEMFS_VOLUME } from '../constants';

/**
 * Unit Testing helper for the createNodes function of a Nx plugin.
 * This function will create files over `memfs` from testCfg.matchingFilesData
 * and invoke the createNodes function on each of the files provided including potential createNodeOptions.
 * It will aggregate the results of each invocation and return the CreateNodesResult.
 *
 * @example
 * ```ts
 * const {projects = {}} = await createFilesAndInvokeCreateNodesOnThem(createNodes, context, undefined, { matchingFilesData});
 *  // project should have one target created
 *  const targets = projects[projectRoot]?.targets ?? {};
 *  expect(Object.keys(targets)).toHaveLength(1);
 *  // target should be the init target
 *  expect(targets[`${CP_TARGET_NAME}--init`]).toBeDefined();
 *  ```
 *
 * @param createNodes
 * @param context
 * @param createNodeOptions
 * @param mockData
 */
export async function createVirtualFilesAndInvokeCreateNodesOnThem<
  T extends Record<string, unknown> | undefined,
>(
  createNodes: CreateNodes,
  context: CreateNodesContext,
  createNodeOptions: T,
  mockData: {
    matchingFilesData: Record<string, string>;
  },
): Promise<CreateNodesResult> {
  const { matchingFilesData } = mockData;
  vol.fromJSON(matchingFilesData, MEMFS_VOLUME);

  const results = await Promise.all(
    Object.keys(matchingFilesData).map(file =>
      createNodes[1](file, createNodeOptions, context),
    ),
  );

  return results.reduce((acc, { projects }) => ({ ...acc, ...projects }), {});
}

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
