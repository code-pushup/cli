import type { CreateNodesContext } from '@nx/devkit';
import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import { invokeCreateNodesOnVirtualFiles } from '@code-pushup/test-nx-utils';
import {
  DEFAULT_TARGET_NAME,
  PACKAGE_NAME,
  PROJECT_JSON_FILE_NAME,
} from '../internal/constants.js';
import { createNodes } from './plugin.js';

describe('@code-pushup/nx-plugin/plugin', () => {
  let context: CreateNodesContext;

  beforeEach(() => {
    context = {
      nxJsonConfiguration: {},
      workspaceRoot: '',
      configFiles: [],
    };
  });

  afterEach(() => {
    vol.reset();
  });

  it('should normalize context and use it to create the configuration target on ROOT project', async () => {
    const projectRoot = '.';
    const matchingFilesData = {
      [`${projectRoot}/${PROJECT_JSON_FILE_NAME}`]: `${JSON.stringify({
        name: '@org/empty-root',
      })}`,
    };

    await expect(
      invokeCreateNodesOnVirtualFiles(
        createNodes,
        context,
        {},
        { matchingFilesData },
      ),
    ).resolves.toEqual({
      [projectRoot]: {
        targets: {
          [`${DEFAULT_TARGET_NAME}--configuration`]: {
            command: `nx g ${PACKAGE_NAME}:configuration --project="@org/empty-root"`,
          },
        },
      },
    });
  });

  it('should normalize context and use it to create the configuration target on PACKAGE project', async () => {
    const projectRoot = 'apps/my-app';
    const matchingFilesData = {
      [`${projectRoot}/${PROJECT_JSON_FILE_NAME}`]: `${JSON.stringify({
        name: '@org/empty-root',
      })}`,
    };

    await expect(
      invokeCreateNodesOnVirtualFiles(
        createNodes,
        context,
        {},
        { matchingFilesData },
      ),
    ).resolves.toEqual({
      [projectRoot]: {
        targets: {
          [`${DEFAULT_TARGET_NAME}--configuration`]: {
            command: `nx g ${PACKAGE_NAME}:configuration --project="@org/empty-root"`,
          },
        },
      },
    });
  });

  it('should create the executor target on ROOT project if configured', async () => {
    const projectRoot = '.';
    const matchingFilesData = {
      [`${projectRoot}/${PROJECT_JSON_FILE_NAME}`]: `${JSON.stringify({
        name: '@org/empty-root',
      })}`,
      [`${projectRoot}/code-pushup.config.ts`]: '{}',
    };

    const result = await invokeCreateNodesOnVirtualFiles(
      createNodes,
      context,
      {
        projectPrefix: 'cli',
      },
      { matchingFilesData },
    );

    expect(result).toMatchObject({
      [projectRoot]: {
        targets: {
          [DEFAULT_TARGET_NAME]: {
            executor: `${PACKAGE_NAME}:cli`,
          },
        },
      },
    });

    expect(
      result[projectRoot].targets[DEFAULT_TARGET_NAME].options,
    ).toHaveProperty('projectPrefix', 'cli');
  });

  it('should create the executor target on PACKAGE project if configured', async () => {
    const projectRoot = 'apps/my-app';
    const matchingFilesData = {
      [`${projectRoot}/${PROJECT_JSON_FILE_NAME}`]: `${JSON.stringify({
        name: '@org/empty-root',
      })}`,
      [`${projectRoot}/code-pushup.config.ts`]: '{}',
    };

    const result = await invokeCreateNodesOnVirtualFiles(
      createNodes,
      context,
      {
        projectPrefix: 'cli',
      },
      { matchingFilesData },
    );

    expect(result).toMatchObject({
      [projectRoot]: {
        targets: {
          [DEFAULT_TARGET_NAME]: {
            executor: `${PACKAGE_NAME}:cli`,
          },
        },
      },
    });

    expect(
      result[projectRoot].targets[DEFAULT_TARGET_NAME].options,
    ).toHaveProperty('projectPrefix', 'cli');
  });
});
