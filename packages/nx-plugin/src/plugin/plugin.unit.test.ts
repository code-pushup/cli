import { CreateNodesContext } from '@nx/devkit';
import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import { createFilesAndInvokeCreateNodesOnThem } from '@code-pushup/test-utils';
import { PROJECT_JSON_FILE_NAME } from '../internal/constants';
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
    const projects = await createFilesAndInvokeCreateNodesOnThem(
      createNodes,
      context,
      {},
      { matchingFilesData },
    );

    // project should have one target created
    const targets = projects[projectRoot]?.targets ?? {};
    expect(Object.keys(targets)).toHaveLength(1);

    // target should be the configuration target
    expect(targets[`${CP_TARGET_NAME}--configuration`]).toBeDefined();
  });

  it('should normalize context and use it to create target on PACKAGE project', async () => {
    const projectRoot = 'apps/my-app';
    const matchingFilesData = {
      [`${projectRoot}/${PROJECT_JSON_FILE_NAME}`]: `${JSON.stringify({
        name: '@org/empty-root',
      })}`,
    };
    const projects = await createFilesAndInvokeCreateNodesOnThem(
      createNodes,
      context,
      {},
      { matchingFilesData },
    );

    // project should have one target created
    const targets = projects[projectRoot]?.targets ?? {};
    expect(Object.keys(targets)).toHaveLength(1);

    // target should be the configuration target
    expect(targets[`${CP_TARGET_NAME}--configuration`]).toBeDefined();
  });
});
