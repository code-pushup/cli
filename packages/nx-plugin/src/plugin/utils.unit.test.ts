import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import { createNodesV2Context } from '@code-pushup/test-nx-utils';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { normalizedCreateNodesV2Context } from './utils.js';

describe('normalizedCreateNodesV2Context', () => {
  it('should provide workspaceRoot', async () => {
    vol.fromJSON(
      {
        'project.json': JSON.stringify({ name: 'my-project' }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
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
      normalizedCreateNodesV2Context(
        createNodesV2Context(),
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
      normalizedCreateNodesV2Context(
        createNodesV2Context({
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
      normalizedCreateNodesV2Context(createNodesV2Context(), 'project.json'),
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
      normalizedCreateNodesV2Context(createNodesV2Context(), 'project.json'),
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
      normalizedCreateNodesV2Context(createNodesV2Context(), 'project.json'),
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
      normalizedCreateNodesV2Context(createNodesV2Context(), 'project.json', {
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
