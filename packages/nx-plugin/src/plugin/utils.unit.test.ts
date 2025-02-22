import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import { createNodesContext } from '@code-pushup/test-nx-utils';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { normalizedCreateNodesContext } from './utils';

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
        createNodesContext({ workspaceRoot: MEMFS_VOLUME }),
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
        createNodesContext(),
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
        createNodesContext({
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
      normalizedCreateNodesContext(createNodesContext(), 'project.json'),
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
      normalizedCreateNodesContext(createNodesContext(), 'project.json'),
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
      normalizedCreateNodesContext(createNodesContext(), 'project.json'),
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
      normalizedCreateNodesContext(createNodesContext(), 'project.json', {
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
