import { vol } from 'memfs';
import { beforeEach, describe, expect } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import * as targets from './target/targets';
import {
  createProjectConfiguration,
  loadProjectConfiguration,
  normalizeCreateNodesOptions,
} from './utils';

describe('normalizeCreateNodesOptions', () => {
  it('should provide default targetName in options', () => {
    expect(normalizeCreateNodesOptions({})).toStrictEqual({
      targetName: 'code-pushup',
    });
  });

  it('should use provided options', () => {
    expect(
      normalizeCreateNodesOptions({
        targetName: 'cp',
        projectPrefix: 'cli',
      }),
    ).toStrictEqual({
      targetName: 'cp',
      projectPrefix: 'cli',
    });
  });
});

describe('loadProjectConfiguration', () => {
  it('should load project configuration', async () => {
    vol.fromJSON(
      {
        ['project.json']: JSON.stringify(
          {
            root: '.',
            name: 'my-lib',
          },
          null,
          2,
        ),
      },
      MEMFS_VOLUME,
    );
    await expect(
      loadProjectConfiguration('./project.json'),
    ).resolves.toStrictEqual({
      root: '.',
      name: 'my-lib',
    });
  });

  it('should load project configuration and provide fallback for root if not given', async () => {
    vol.fromJSON(
      {
        ['packages/project.json']: JSON.stringify(
          {
            name: 'my-lib',
          },
          null,
          2,
        ),
      },
      MEMFS_VOLUME,
    );
    await expect(
      loadProjectConfiguration('./packages/project.json'),
    ).resolves.toStrictEqual({
      root: './packages',
      name: 'my-lib',
    });
  });
});

describe('createProjectConfiguration', () => {
  it('should create project configuration', async () => {
    const root = '.';
    vol.fromJSON(
      {
        ['project.json']: JSON.stringify(
          {
            root,
            name: 'my-lib',
          },
          null,
          2,
        ),
      },
      MEMFS_VOLUME,
    );

    await expect(
      createProjectConfiguration(
        {
          root,
          name: 'my-lib',
        },
        {},
      ),
    ).resolves.toStrictEqual({
      namedInputs: {},
      targets: expect.any(Object),
    });
  });

  it('should normalize options and pass project configuration and options to createTargets', async () => {
    const createTargetsSpy = vi
      .spyOn(targets, 'createTargets')
      .mockResolvedValue({ proj: {} });
    const projectCfg = {
      root: '.',
      name: 'my-lib',
    };
    await createProjectConfiguration(projectCfg, {});
    expect(createTargetsSpy).toHaveBeenCalledTimes(1);
    expect(createTargetsSpy).toHaveBeenCalledWith(projectCfg, {
      targetName: 'code-pushup',
    });
  });
});
