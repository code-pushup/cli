import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import { createNodesContextV2 } from '@code-pushup/test-nx-utils';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { normalizedCreateNodesContext } from './utils.js';

describe('normalizedCreateNodesContext', () => {
  it('should provide workspaceRoot', async () => {
    vol.fromJSON(
      {
        'project.json': JSON.stringify({ name: 'my-project' }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      normalizedCreateNodesContext(
        createNodesContextV2({ workspaceRoot: MEMFS_VOLUME }),
        'project.json',
      ),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        workspaceRoot: MEMFS_VOLUME,
      }),
    );
  });

  it('should provide projectRoot', async () => {
    vol.fromJSON(
      {
        'packages/utils/project.json': JSON.stringify({
          name: 'my-project',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      normalizedCreateNodesContext(
        createNodesContextV2(),
        'packages/utils/project.json',
      ),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        projectRoot: 'packages/utils',
      }),
    );
  });

  it('should provide nxJsonConfiguration', async () => {
    vol.fromJSON(
      {
        'project.json': JSON.stringify({
          name: 'my-project',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      normalizedCreateNodesContext(
        createNodesContextV2({
          nxJsonConfiguration: {
            workspaceLayout: {
              libsDir: 'libs',
            },
          },
        }),
        'project.json',
      ),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        nxJsonConfiguration: {
          workspaceLayout: {
            libsDir: 'libs',
          },
        },
      }),
    );
  });

  it('should provide projectJson', async () => {
    vol.fromJSON(
      {
        'project.json': JSON.stringify({
          name: 'my-project',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      normalizedCreateNodesContext(createNodesContextV2(), 'project.json'),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        projectJson: {
          name: 'my-project',
        },
      }),
    );
  });

  it('should throw for empty project.json', async () => {
    vol.fromJSON(
      {
        'project.json': '',
      },
      MEMFS_VOLUME,
    );

    await expect(
      normalizedCreateNodesContext(createNodesContextV2(), 'project.json'),
    ).rejects.toThrow('Error parsing project.json file project.json.');
  });

  it('should provide default targetName in createOptions', async () => {
    vol.fromJSON(
      {
        'project.json': JSON.stringify({
          name: 'my-project',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      normalizedCreateNodesContext(createNodesContextV2(), 'project.json'),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        createOptions: {
          targetName: 'code-pushup',
        },
      }),
    );
  });

  it('should provide createOptions', async () => {
    vol.fromJSON(
      {
        'project.json': JSON.stringify({
          name: 'my-project',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      normalizedCreateNodesContext(createNodesContextV2(), 'project.json', {
        projectPrefix: 'cli',
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        createOptions: {
          targetName: 'code-pushup',
          projectPrefix: 'cli',
        },
      }),
    );
  });
});
