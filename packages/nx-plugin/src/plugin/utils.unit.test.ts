import { vol } from 'memfs';
import { createNodesV2Context } from '@code-pushup/test-nx-utils';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { normalizedCreateNodesV2Context } from './utils.js';

describe('normalizedCreateNodesV2Context', () => {
  const projectJsonPath = (projectRoot = '') =>
    `${MEMFS_VOLUME}/${projectRoot}${projectRoot ? '/' : ''}project.json`;

  const setupProjectJson = (options?: {
    config?: Record<string, unknown>;
    root?: string;
  }) => {
    const { config = { name: 'my-project' }, root = '' } = options ?? {};
    vol.fromJSON(
      {
        [`${root}${root ? '/' : ''}project.json`]: JSON.stringify(config),
      },
      MEMFS_VOLUME,
    );
  };

  it('should provide workspaceRoot', async () => {
    setupProjectJson();

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(),
      ),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        workspaceRoot: MEMFS_VOLUME,
      }),
    );
  });

  it('should provide projectRoot', async () => {
    const root = 'packages/utils';
    setupProjectJson({ root });

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(root),
      ),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        projectRoot: `${MEMFS_VOLUME}/${root}`,
      }),
    );
  });

  it('should provide nxJsonConfiguration', async () => {
    setupProjectJson();

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({
          workspaceRoot: MEMFS_VOLUME,
          nxJsonConfiguration: {
            workspaceLayout: {
              libsDir: 'libs',
            },
          },
        }),
        projectJsonPath(),
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
    setupProjectJson({ config: { name: 'my-project' } });

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(),
      ),
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
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(),
      ),
    ).rejects.toThrowError(
      `Error parsing project.json file ${projectJsonPath()}.`,
    );
  });

  it('should provide default targetName in createOptions', async () => {
    setupProjectJson();

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(),
      ),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        createOptions: {
          targetName: 'code-pushup',
        },
      }),
    );
  });

  it('should provide createOptions', async () => {
    setupProjectJson();

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(),
        {
          projectPrefix: 'cli',
        },
      ),
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
