import { CreateNodesContext } from '@nx/devkit';
import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import { invokeCreateNodesOnVirtualFiles } from '@code-pushup/test-nx-utils';
import { PACKAGE_NAME, PROJECT_JSON_FILE_NAME } from '../internal/constants';
import { CP_TARGET_NAME } from './constants';
import { createNodes } from './plugin';

describe('@code-pushup/nx-plugin/plugin', () => {
  let context: CreateNodesContext;

  beforeEach(() => {
    context = {
      nxJsonConfiguration: {},
      workspaceRoot: '',
    };
  });

  afterEach(() => {
    vol.reset();
  });

  it('should normalize context and use it to create target on ROOT project', async () => {
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
    ).resolves.toStrictEqual({
      [projectRoot]: {
        targets: {
          [`${CP_TARGET_NAME}--configuration`]: {
            command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName=code-pushup --project=@org/empty-root`,
          },
        },
      },
    });
  });

  it('should normalize context and use it to create target on PACKAGE project', async () => {
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
    ).resolves.toStrictEqual({
      [projectRoot]: {
        targets: {
          [`${CP_TARGET_NAME}--configuration`]: {
            command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName=code-pushup --project=@org/empty-root`,
          },
        },
      },
    });
  });
});
