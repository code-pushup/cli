import { vol } from 'memfs';
import { rm } from 'node:fs/promises';
import { beforeEach, expect } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { CP_TARGET_NAME } from '../constants';
import { NormalizedCreateNodesContext } from '../types';
import { codePushupTarget } from './code-pushup-target';
import { createTargets } from './targets';

describe('createTargets', () => {
  beforeEach(async () => {
    // needed to have the folder present. readdir otherwise it fails
    vol.fromJSON(
      {
        x: '',
      },
      MEMFS_VOLUME,
    );
    await rm('x');
  });

  it('should return configuration targets for project without code-pushup config', async () => {
    const projectName = 'plugin-my-plugin';
    await expect(
      createTargets({
        projectRoot: '.',
        projectJson: {
          name: projectName,
        },
        createOptions: {},
      } as NormalizedCreateNodesContext),
    ).resolves.toStrictEqual({
      [`${CP_TARGET_NAME}--configuration`]: {
        command: `nx g nx-plugin:configuration --project=${projectName}`,
      },
    });
  });

  it('should return autorun target for project with code-pushup config', async () => {
    vol.fromJSON(
      {
        'code-pushup.config.ts': '',
      },
      MEMFS_VOLUME,
    );
    const projectName = 'plugin-my-plugin';
    await expect(
      createTargets({
        projectRoot: '.',
        projectJson: {
          name: projectName,
        },
        createOptions: {},
      } as NormalizedCreateNodesContext),
    ).resolves.toStrictEqual({
      [`${CP_TARGET_NAME}--autorun`]: {
        executor: '@code-pushup/nx-plugin:autorun',
      },
    });
  });

  it('should return autorun target for project with code-pushup config and consider projectPrefix', async () => {
    vol.fromJSON(
      {
        'code-pushup.config.ts': '',
      },
      MEMFS_VOLUME,
    );
    const projectName = 'plugin-my-plugin';
    await expect(
      createTargets(
        {
          projectRoot: '.',
          projectJson: {
            name: projectName,
          },
          createOptions: {},
        } as NormalizedCreateNodesContext,
        {
          projectPrefix: 'cli',
        },
      ),
    ).resolves.toStrictEqual({
      [`${CP_TARGET_NAME}--autorun`]: {
        executor: '@code-pushup/nx-plugin:autorun',
        options: {
          projectPrefix: 'cli',
        },
      },
    });
  });
});

describe('codePushupTarget', () => {
  it('should return autorun target', () => {
    const target = codePushupTarget();

    expect(target).toStrictEqual({
      executor: '@code-pushup/nx-plugin:autorun',
    });
  });
});
