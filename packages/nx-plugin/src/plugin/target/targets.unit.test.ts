import type { ProjectConfiguration } from '@nx/devkit';
import { vol } from 'memfs';
import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, expect } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { DEFAULT_TARGET_NAME, PACKAGE_NAME } from '../../internal/constants.js';
import { CP_TARGET_NAME } from '../constants.js';
import type { NormalizedCreateNodesOptions } from '../types.js';
import { createTargets } from './targets.js';

describe('createTargets', () => {
  const projectName = 'plugin-my-plugin';
  const projectConfig = {
    root: '.',
    name: projectName,
  } as ProjectConfiguration;
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
    await expect(
      createTargets(projectConfig, {} as NormalizedCreateNodesOptions),
    ).resolves.toStrictEqual({
      [`${CP_TARGET_NAME}--configuration`]: {
        command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName="code-pushup" --project="${projectName}"`,
      },
    });
  });

  it('should return configuration targets for empty project without code-pushup config and consider targetName', async () => {
    const targetName = 'cp';
    await expect(
      createTargets(projectConfig, { targetName }),
    ).resolves.toStrictEqual({
      [`${targetName}--configuration`]: {
        command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName="${targetName}" --project="${projectName}"`,
      },
    });
  });

  it('should NOT return configuration target if code-pushup config is given', async () => {
    vol.fromJSON(
      {
        [`code-pushup.config.ts`]: `{}`,
      },
      MEMFS_VOLUME,
    );
    const targetName = 'cp';
    await expect(
      createTargets(projectConfig, { targetName }),
    ).resolves.toStrictEqual(
      expect.not.objectContaining({
        [`${targetName}--configuration`]: expect.any(Object),
      }),
    );
  });

  it('should return executor target if code-pushup config is given', async () => {
    vol.fromJSON(
      {
        [`code-pushup.config.ts`]: `{}`,
      },
      MEMFS_VOLUME,
    );
    const targetName = 'cp';
    await expect(
      createTargets(projectConfig, { targetName }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        [targetName]: {
          executor: `${PACKAGE_NAME}:cli`,
        },
      }),
    );
  });

  it('should return executor targets for project if configured', async () => {
    vol.fromJSON(
      {
        [`code-pushup.config.ts`]: `{}`,
      },
      MEMFS_VOLUME,
    );
    await expect(
      createTargets(projectConfig, {} as NormalizedCreateNodesOptions),
    ).resolves.toStrictEqual({
      [DEFAULT_TARGET_NAME]: {
        executor: '@code-pushup/nx-plugin:cli',
      },
    });
  });

  it('should return executor targets for configured project and use given targetName', async () => {
    vol.fromJSON(
      {
        [`code-pushup.config.ts`]: `{}`,
      },
      MEMFS_VOLUME,
    );
    await expect(
      createTargets(projectConfig, { targetName: 'cp' }),
    ).resolves.toStrictEqual({
      cp: {
        executor: '@code-pushup/nx-plugin:cli',
      },
    });
  });

  it('should include projectPrefix options in executor targets if given', async () => {
    vol.fromJSON(
      {
        [`code-pushup.config.ts`]: `{}`,
      },
      MEMFS_VOLUME,
    );
    await expect(
      createTargets(projectConfig, {
        projectPrefix: 'cli',
      } as NormalizedCreateNodesOptions),
    ).resolves.toStrictEqual({
      [DEFAULT_TARGET_NAME]: expect.objectContaining({
        options: { projectPrefix: 'cli' },
      }),
    });
  });
});
