import type { CreateNodesContext } from '@nx/devkit';
import { vol } from 'memfs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { PACKAGE_NAME, PROJECT_JSON_FILE_NAME } from '../internal/constants.js';
import { CP_TARGET_NAME } from './constants.js';
import { createNodesV1Fn } from './plugin';

describe('createNodesV1Fn', () => {
  const context: CreateNodesContext = {
    nxJsonConfiguration: {},
    workspaceRoot: '',
  };

  it('should normalize context of project.json with missing root property', async () => {
    vol.fromJSON(
      {
        [PROJECT_JSON_FILE_NAME]: `${JSON.stringify({
          name: '@org/empty-root',
        })}`,
      },
      MEMFS_VOLUME,
    );

    await expect(
      createNodesV1Fn(PROJECT_JSON_FILE_NAME, {}, context),
    ).resolves.toStrictEqual({
      projects: {
        ['.']: {
          targets: {
            [`${CP_TARGET_NAME}--configuration`]: {
              command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName="code-pushup" --project="@org/empty-root"`,
            },
          },
        },
      },
    });
  });

  it('should normalize context and use it to create the configuration target on ROOT project', async () => {
    vol.fromJSON(
      {
        [PROJECT_JSON_FILE_NAME]: `${JSON.stringify({
          name: '@org/empty-root',
        })}`,
      },
      MEMFS_VOLUME,
    );

    await expect(
      createNodesV1Fn(PROJECT_JSON_FILE_NAME, {}, context),
    ).resolves.toStrictEqual({
      projects: {
        ['.']: {
          targets: {
            [`${CP_TARGET_NAME}--configuration`]: {
              command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName="code-pushup" --project="@org/empty-root"`,
            },
          },
        },
      },
    });
  });

  it('should normalize context and use it to create the configuration target on PACKAGE project', async () => {
    const projectRoot = 'apps/my-app';
    vol.fromJSON(
      {
        [join(projectRoot, PROJECT_JSON_FILE_NAME)]: `${JSON.stringify({
          root: projectRoot,
          name: '@org/empty-root',
        })}`,
      },
      MEMFS_VOLUME,
    );

    await expect(
      createNodesV1Fn(join(projectRoot, PROJECT_JSON_FILE_NAME), {}, context),
    ).resolves.toStrictEqual({
      projects: {
        [projectRoot]: {
          targets: {
            [`${CP_TARGET_NAME}--configuration`]: {
              command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName="code-pushup" --project="@org/empty-root"`,
            },
          },
        },
      },
    });
  });

  it('should create the executor target on ROOT project if configured', async () => {
    vol.fromJSON(
      {
        [PROJECT_JSON_FILE_NAME]: `${JSON.stringify({
          root: '.',
          name: '@org/empty-root',
        })}`,
        ['code-pushup.config.ts']: '{}',
      },
      MEMFS_VOLUME,
    );

    await expect(
      createNodesV1Fn(
        PROJECT_JSON_FILE_NAME,
        {
          projectPrefix: 'cli',
        },
        context,
      ),
    ).resolves.toStrictEqual({
      projects: {
        ['.']: {
          targets: {
            [CP_TARGET_NAME]: {
              executor: `${PACKAGE_NAME}:cli`,
              options: {
                projectPrefix: 'cli',
              },
            },
          },
        },
      },
    });
  });

  it('should create the executor target on PACKAGE project if configured', async () => {
    const projectRoot = 'apps/my-app';
    vol.fromJSON(
      {
        [join(projectRoot, PROJECT_JSON_FILE_NAME)]: `${JSON.stringify({
          root: projectRoot,
          name: '@org/empty-root',
        })}`,
        [join(projectRoot, 'code-pushup.config.ts')]: '{}',
      },
      MEMFS_VOLUME,
    );

    await expect(
      createNodesV1Fn(
        join(projectRoot, PROJECT_JSON_FILE_NAME),
        {
          projectPrefix: 'cli',
        },
        context,
      ),
    ).resolves.toStrictEqual({
      projects: {
        [projectRoot]: {
          targets: {
            [CP_TARGET_NAME]: {
              executor: `${PACKAGE_NAME}:cli`,
              options: {
                projectPrefix: 'cli',
              },
            },
          },
        },
      },
    });
  });
});
