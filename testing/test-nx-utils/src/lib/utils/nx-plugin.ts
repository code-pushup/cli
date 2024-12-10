import type {
  // eslint-disable-next-line import/no-deprecated
  CreateNodes,
  CreateNodesContext,
  CreateNodesContextV2,
  CreateNodesResult,
} from '@nx/devkit';
import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';

/**
 * Unit Testing helper for the createNodes function of a Nx plugin.
 * This function will create files over `memfs` from testCfg.matchingFilesData
 * and invoke the createNodes function on each of the files provided including potential createNodeOptions.
 * It will aggregate the results of each invocation and return the projects from CreateNodesResult.
 *
 * @example
 * ```ts
 * const projects = await createFilesAndInvokeCreateNodesOnThem(createNodes, context, undefined, { matchingFilesData});
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
export async function invokeCreateNodesOnVirtualFiles<
  T extends Record<string, unknown> | undefined,
>(
  // FIXME: refactor this to use the V2 api & remove the eslint disable on the whole file
  // eslint-disable-next-line import/no-deprecated,deprecation/deprecation
  createNodes: CreateNodes,
  context: CreateNodesContext,
  createNodeOptions: T,
  mockData: {
    matchingFilesData: Record<string, string>;
  },
) {
  const { matchingFilesData } = mockData;
  vol.fromJSON(matchingFilesData, MEMFS_VOLUME);

  const results = await Promise.all(
    Object.keys(matchingFilesData).map(file =>
      createNodes[1](file, createNodeOptions, context),
    ),
  );

  const result: NonNullable<CreateNodesResult['projects']> = {};
  return results.reduce(
    (acc, { projects }) => ({ ...acc, ...projects }),
    result,
  );
}

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
