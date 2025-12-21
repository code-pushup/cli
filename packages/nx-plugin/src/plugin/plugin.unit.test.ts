import type { CreateNodesContextV2, CreateNodesResultV2 } from '@nx/devkit';
import { vol } from 'memfs';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { PACKAGE_NAME, PROJECT_JSON_FILE_NAME } from '../internal/constants.js';
import { CP_TARGET_NAME } from './constants.js';
import { createNodesV2 } from './plugin.js';

describe('@code-pushup/nx-plugin/plugin', () => {
  let context: CreateNodesContextV2;
  const createNodesFunction = createNodesV2[1];
  const projectJsonPath = (projectRoot: string) =>
    `${MEMFS_VOLUME}/${projectRoot}/${PROJECT_JSON_FILE_NAME}`;
  const setupProject = (projectRoot: string, withConfig = true) => {
    vol.fromJSON(
      {
        [`${projectRoot}/${PROJECT_JSON_FILE_NAME}`]: JSON.stringify({
          name: '@org/empty-root',
        }),
        ...(withConfig
          ? { [`${projectRoot}/code-pushup.config.ts`]: '{}' }
          : {}),
      },
      MEMFS_VOLUME,
    );
  };

  beforeEach(() => {
    context = {
      nxJsonConfiguration: {},
      workspaceRoot: MEMFS_VOLUME,
      configFiles: [],
    };
  });

  afterEach(() => {
    vol.reset();
  });

  it('should normalize context and use it to create the configuration target on ROOT project', async () => {
    const projectRoot = '.';
    setupProject(projectRoot, false);

    const result = await createNodesFunction(
      [projectJsonPath(projectRoot)],
      {},
      context,
    );

    expect(result).toHaveLength(1);
    const [file, nodesResult] = result[0] as CreateNodesResultV2[number];
    expect(file).toBe(projectJsonPath(projectRoot));
    const actualProjectRoot = Object.keys(
      nodesResult.projects ?? {},
    )[0] as string;
    expect(nodesResult.projects).toHaveProperty(actualProjectRoot, {
      targets: {
        [`${CP_TARGET_NAME}--configuration`]: {
          command: `nx g ${PACKAGE_NAME}:configuration --project="@org/empty-root"`,
        },
      },
    });
  });

  it('should normalize context and use it to create the configuration target on PACKAGE project', async () => {
    const projectRoot = 'apps/my-app';
    setupProject(projectRoot, false);

    const result = await createNodesFunction(
      [projectJsonPath(projectRoot)],
      {},
      context,
    );

    expect(result).toHaveLength(1);
    const [file, nodesResult] = result[0] as CreateNodesResultV2[number];
    expect(file).toBe(projectJsonPath(projectRoot));
    const actualProjectRoot = Object.keys(
      nodesResult.projects ?? {},
    )[0] as string;
    expect(nodesResult.projects).toHaveProperty(actualProjectRoot, {
      targets: {
        [`${CP_TARGET_NAME}--configuration`]: {
          command: `nx g ${PACKAGE_NAME}:configuration --project="@org/empty-root"`,
        },
      },
    });
  });

  it('should create the executor target on ROOT project if configured', async () => {
    const projectRoot = '.';
    setupProject(projectRoot);

    const result = await createNodesFunction(
      [projectJsonPath(projectRoot)],
      {
        projectPrefix: 'cli',
      },
      context,
    );

    expect(result).toHaveLength(1);
    const [file, nodesResult] = result[0] as CreateNodesResultV2[number];
    expect(file).toBe(projectJsonPath(projectRoot));
    const actualProjectRoot = Object.keys(
      nodesResult.projects ?? {},
    )[0] as string;
    expect(nodesResult.projects).toHaveProperty(actualProjectRoot, {
      targets: {
        [CP_TARGET_NAME]: {
          executor: `${PACKAGE_NAME}:cli`,
          options: {
            projectPrefix: 'cli',
          },
        },
      },
    });
  });

  it('should create the executor target on PACKAGE project if configured', async () => {
    const projectRoot = 'apps/my-app';
    setupProject(projectRoot);

    const result = await createNodesFunction(
      [projectJsonPath(projectRoot)],
      {
        projectPrefix: 'cli',
      },
      context,
    );

    expect(result).toHaveLength(1);
    const [file, nodesResult] = result[0] as CreateNodesResultV2[number];
    expect(file).toBe(projectJsonPath(projectRoot));
    const actualProjectRoot = Object.keys(
      nodesResult.projects ?? {},
    )[0] as string;
    expect(nodesResult.projects).toHaveProperty(actualProjectRoot, {
      targets: {
        [CP_TARGET_NAME]: {
          executor: `${PACKAGE_NAME}:cli`,
          options: {
            projectPrefix: 'cli',
          },
        },
      },
    });
  });
});
