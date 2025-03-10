import type {
  CreateNodes,
  CreateNodesContext,
  CreateNodesContextV2,
  CreateNodesResult,
  CreateNodesV2,
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
export async function invokeCreateNodesOnVirtualFilesV1<
  T extends Record<string, unknown> | undefined,
>(
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

export async function invokeCreateNodesOnVirtualFilesV2<
  T extends Record<string, unknown> | undefined,
>(
  createNodes: CreateNodesV2,
  context: CreateNodesContextV2,
  createNodeOptions: T,
  mockData: {
    matchingFilesData: Record<string, string>;
  },
) {
  const { matchingFilesData } = mockData;
  vol.fromJSON(matchingFilesData, MEMFS_VOLUME);

  const files = Object.keys(matchingFilesData);

  const results = await createNodes[1](files, createNodeOptions, context);

  const result: NonNullable<CreateNodesResult['projects']> = {};
  return results.reduce(
    (acc, [_, { projects }]) => ({ ...acc, ...projects }),
    result,
  );
}

export function createNodesContextV1(
  options?: Partial<CreateNodesContext>,
): CreateNodesContext {
  const { workspaceRoot = process.cwd(), nxJsonConfiguration = {} } =
    options ?? {};
  return {
    workspaceRoot,
    nxJsonConfiguration,
    configFiles: [],
  };
}

export function createNodesContextV2(
  options?: Partial<CreateNodesContextV2>,
): CreateNodesContextV2 {
  const { workspaceRoot = process.cwd(), nxJsonConfiguration = {} } =
    options ?? {};
  return {
    workspaceRoot,
    nxJsonConfiguration,
  };
}
