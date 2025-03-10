import type { CreateNodesContext, CreateNodesContextV2 } from '@nx/devkit';
import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import {
  createNodesContextV1,
  createNodesContextV2,
  invokeCreateNodesOnVirtualFilesV1,
  invokeCreateNodesOnVirtualFilesV2,
} from '@code-pushup/test-nx-utils';
import { PACKAGE_NAME, PROJECT_JSON_FILE_NAME } from '../internal/constants.js';
import { CP_TARGET_NAME } from './constants.js';
import { createNodes, createNodesV2 } from './plugin.js';

describe('@code-pushup/nx-plugin/plugin', () => {
  describe('V1', () => {
    let context: CreateNodesContext;

    beforeEach(() => {
      context = createNodesContextV1({
        nxJsonConfiguration: {},
        workspaceRoot: '',
      });
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
        invokeCreateNodesOnVirtualFilesV1(
          createNodes,
          context,
          {},
          { matchingFilesData },
        ),
      ).resolves.toStrictEqual({
        [projectRoot]: {
          targets: {
            [`${CP_TARGET_NAME}--configuration`]: {
              command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName="code-pushup" --project="@org/empty-root"`,
            },
          },
        },
      });
    });

    it('should create the executor target on PACKAGE project if configured', async () => {
      const projectRoot = 'apps/my-app';
      const matchingFilesData = {
        [`${projectRoot}/${PROJECT_JSON_FILE_NAME}`]: `${JSON.stringify({
          name: '@org/empty-root',
        })}`,
        [`${projectRoot}/code-pushup.config.ts`]: '{}',
      };

      await expect(
        invokeCreateNodesOnVirtualFilesV1(
          createNodes,
          context,
          {
            projectPrefix: 'cli',
          },
          { matchingFilesData },
        ),
      ).resolves.toStrictEqual({
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
      });
    });
  });

  describe('V2', () => {
    let context: CreateNodesContextV2;

    beforeEach(() => {
      context = createNodesContextV2({
        nxJsonConfiguration: {},
        workspaceRoot: '',
      });
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
        invokeCreateNodesOnVirtualFilesV2(
          createNodesV2,
          context,
          {},
          { matchingFilesData },
        ),
      ).resolves.toStrictEqual({
        [projectRoot]: {
          targets: {
            [`${CP_TARGET_NAME}--configuration`]: {
              command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName="code-pushup" --project="@org/empty-root"`,
            },
          },
        },
      });
    });

    it('should create the executor target on PACKAGE project if configured', async () => {
      const projectRoot = 'apps/my-app';
      const matchingFilesData = {
        [`${projectRoot}/${PROJECT_JSON_FILE_NAME}`]: `${JSON.stringify({
          name: '@org/empty-root',
        })}`,
        [`${projectRoot}/code-pushup.config.ts`]: '{}',
      };

      await expect(
        invokeCreateNodesOnVirtualFilesV2(
          createNodesV2,
          context,
          {
            projectPrefix: 'cli',
          },
          { matchingFilesData },
        ),
      ).resolves.toStrictEqual({
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
      });
    });
  });
});
