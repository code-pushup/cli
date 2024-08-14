import { vol } from 'memfs';
import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, expect } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { DEFAULT_TARGET_NAME, PACKAGE_NAME } from '../../internal/constants';
import { CP_TARGET_NAME } from '../constants';
import { NormalizedCreateNodesContext } from '../types';
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

  afterEach(() => {
    vol.reset();
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
        command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName="code-pushup" --project="${projectName}"`,
      },
    });
  });

  it('should return configuration targets for empty project without code-pushup config and consider targetName', async () => {
    const projectName = 'plugin-my-plugin';
    const targetName = 'cp';
    await expect(
      createTargets({
        projectRoot: '.',
        projectJson: {
          name: projectName,
        },
        createOptions: {
          targetName,
        },
      } as NormalizedCreateNodesContext),
    ).resolves.toStrictEqual({
      [`${targetName}--configuration`]: {
        command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName="cp" --project="${projectName}"`,
      },
    });
  });

  it('should NOT return configuration target if code-pushup config is given', async () => {
    const projectName = 'plugin-my-plugin';
    vol.fromJSON(
      {
        [`code-pushup.config.ts`]: `{}`,
      },
      MEMFS_VOLUME,
    );
    const targetName = 'cp';
    await expect(
      createTargets({
        projectRoot: '.',
        projectJson: {
          name: projectName,
        },
        createOptions: {
          targetName,
        },
      } as NormalizedCreateNodesContext),
    ).resolves.toStrictEqual(
      expect.not.objectContaining({
        [`${targetName}--configuration`]: expect.any(Object),
      }),
    );
  });

  it('should return executor target if code-pushup config is given', async () => {
    const projectName = 'plugin-my-plugin';
    vol.fromJSON(
      {
        [`code-pushup.config.ts`]: `{}`,
      },
      MEMFS_VOLUME,
    );
    const targetName = 'cp';
    await expect(
      createTargets({
        projectRoot: '.',
        projectJson: {
          name: projectName,
        },
        createOptions: {
          targetName,
        },
      } as NormalizedCreateNodesContext),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        [targetName]: {
          executor: `${PACKAGE_NAME}:command`,
        },
      }),
    );
  });

  it('should return executor targets for project if configured', async () => {
    const projectName = 'plugin-my-plugin';
    vol.fromJSON(
      {
        [`code-pushup.config.ts`]: `{}`,
      },
      MEMFS_VOLUME,
    );
    await expect(
      createTargets({
        projectRoot: '.',
        projectJson: {
          name: projectName,
        },
        createOptions: {},
      } as NormalizedCreateNodesContext),
    ).resolves.toStrictEqual({
      [DEFAULT_TARGET_NAME]: {
        executor: '@code-pushup/nx-plugin:command',
      },
    });
  });

  it('should return executor targets for configured project and use given targetName', async () => {
    const projectName = 'plugin-my-plugin';
    vol.fromJSON(
      {
        [`code-pushup.config.ts`]: `{}`,
      },
      MEMFS_VOLUME,
    );
    await expect(
      createTargets({
        projectRoot: '.',
        projectJson: {
          name: projectName,
        },
        createOptions: {
          targetName: 'cp',
        },
      } as NormalizedCreateNodesContext),
    ).resolves.toStrictEqual({
      cp: {
        executor: '@code-pushup/nx-plugin:command',
      },
    });
  });
});
