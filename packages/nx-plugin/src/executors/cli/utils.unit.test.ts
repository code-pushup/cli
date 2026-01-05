import { vol } from 'memfs';
import {
  type MockInstance,
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createNodesV2Context } from '@code-pushup/test-nx-utils';
import { MEMFS_VOLUME, osAgnosticPath } from '@code-pushup/test-utils';
import { normalizedCreateNodesV2Context } from '../../plugin/utils.js';
import type { Command } from '../internal/types.js';
import {
  parseCliExecutorOnlyOptions,
  parseCliExecutorOptions,
  parsePrintConfigExecutorOptions,
} from './utils.js';

describe('parsePrintConfigExecutorOptions', () => {
  it('should provide NO default output path', () => {
    expect(parsePrintConfigExecutorOptions({})).toStrictEqual(
      expect.not.objectContaining({ output: expect.anything() }),
    );
  });

  it('should process given output path', () => {
    expect(
      parsePrintConfigExecutorOptions({ output: 'code-pushup.config.json' }),
    ).toStrictEqual(
      expect.objectContaining({ output: 'code-pushup.config.json' }),
    );
  });
});

describe('parseCliExecutorOnlyOptions', () => {
  it('should provide NO default projectPrefix', () => {
    expect(parseCliExecutorOnlyOptions({})).toStrictEqual(
      expect.not.objectContaining({ projectPrefix: expect.anything() }),
    );
  });

  it('should process given projectPrefix', () => {
    expect(parseCliExecutorOnlyOptions({ projectPrefix: 'cli' })).toStrictEqual(
      expect.objectContaining({ projectPrefix: 'cli' }),
    );
  });

  it('should provide NO default dryRun', () => {
    expect(parseCliExecutorOnlyOptions({})).toStrictEqual(
      expect.not.objectContaining({ dryRun: expect.anything() }),
    );
  });

  it('should process given dryRun', () => {
    expect(parseCliExecutorOnlyOptions({ dryRun: false })).toStrictEqual(
      expect.objectContaining({ dryRun: false }),
    );
  });

  it('should provide default onlyPlugins', () => {
    expect(parseCliExecutorOnlyOptions({})).toStrictEqual(
      expect.not.objectContaining({ onlyPlugins: ['json'] }),
    );
  });

  it('should process given onlyPlugins', () => {
    expect(
      parseCliExecutorOnlyOptions({ onlyPlugins: ['md', 'json'] }),
    ).toStrictEqual(expect.objectContaining({ onlyPlugins: ['md', 'json'] }));
  });

  it('should log env variables options if given', async () => {
    expect(
      parseCliExecutorOnlyOptions({ env: { TEST_ENV_VAR: '42' } }),
    ).toStrictEqual(expect.objectContaining({ env: { TEST_ENV_VAR: '42' } }));
  });

  it('should process given bin', () => {
    expect(parseCliExecutorOnlyOptions({ bin: 'index.js' })).toStrictEqual(
      expect.objectContaining({ bin: 'index.js' }),
    );
  });
});

describe('parseCliExecutorOptions', () => {
  let processEnvSpy: MockInstance<[], NodeJS.ProcessEnv>;

  beforeAll(() => {
    processEnvSpy = vi.spyOn(process, 'env', 'get').mockReturnValue({});
  });

  afterAll(() => {
    processEnvSpy.mockRestore();
  });

  it('should leverage other config helper to assemble the executor config', () => {
    const projectName = 'my-app';
    const executorOptions = parseCliExecutorOptions(
      {
        persist: {
          filename: 'from-options',
        },
      },
      {
        projectName,
        workspaceRoot: 'workspaceRoot',
        projectConfig: {
          name: projectName,
          root: 'root',
        },
      },
    );
    expect(osAgnosticPath(executorOptions.config ?? '')).toBe(
      osAgnosticPath('root/code-pushup.config.ts'),
    );
    expect(executorOptions).toEqual(
      expect.objectContaining({
        verbose: false,
      }),
    );

    expect(processEnvSpy.mock.calls.length).toBeGreaterThanOrEqual(1);

    expect(executorOptions.persist).toEqual(
      expect.objectContaining({
        filename: 'from-options',
      }),
    );

    expect(osAgnosticPath(executorOptions.persist?.outputDir ?? '')).toBe(
      osAgnosticPath('workspaceRoot/.code-pushup/my-app'),
    );
  });

  it('should include the env options', () => {
    const projectName = 'my-app';
    const env = {
      NODE_OPTIONS: '--import tsx',
      TSX_TSCONFIG_PATH: 'tsconfig.base.json',
    };

    const executorOptions = parseCliExecutorOptions(
      { env },
      {
        projectName,
        workspaceRoot: 'workspaceRoot',
        projectConfig: {
          name: projectName,
          root: 'root',
        },
      },
    );

    expect(executorOptions.env).toStrictEqual(env);
  });

  it.each<Command | undefined>(['upload', 'autorun', undefined])(
    'should include upload config for command %s if API key is provided',
    command => {
      const projectName = 'my-app';
      const executorOptions = parseCliExecutorOptions(
        {
          command,
          upload: {
            apiKey: '123456789',
          },
        },
        {
          projectName,
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: 'my-app',
            root: 'root',
          },
        },
      );

      expect(executorOptions).toEqual(
        expect.objectContaining({
          upload: expect.any(Object),
        }),
      );
    },
  );

  it.each<Command>(['collect'])(
    'should not include upload config for command %s',
    command => {
      const projectName = 'my-app';
      const executorOptions = parseCliExecutorOptions(
        {
          command,
          upload: {
            organization: 'code-pushup',
          },
        },
        {
          projectName,
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: 'my-app',
            root: 'root',
          },
        },
      );

      expect(executorOptions).toEqual(
        expect.not.objectContaining({
          upload: expect.any(Object),
        }),
      );
    },
  );
});

describe('normalizedCreateNodesV2Context', () => {
  const CP_TARGET_NAME = 'code-pushup';

  const projectJsonPath = (projectRoot: string) =>
    `${MEMFS_VOLUME}/${projectRoot}/project.json`;

  const setupProjectJson = (options: {
    projectRoot: string;
    config: Record<string, unknown>;
  }) => {
    const { projectRoot, config } = options;
    vol.fromJSON(
      {
        [`${projectRoot}/project.json`]: JSON.stringify(config),
      },
      MEMFS_VOLUME,
    );
  };

  it('should normalize context with default target name', async () => {
    const projectRoot = 'libs/my-lib';
    setupProjectJson({
      projectRoot,
      config: { name: 'my-lib', root: projectRoot, targets: {} },
    });

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(projectRoot),
      ),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        projectRoot: expect.pathToMatch(`${MEMFS_VOLUME}/${projectRoot}`),
        workspaceRoot: MEMFS_VOLUME,
        projectJson: { name: 'my-lib', root: projectRoot, targets: {} },
        createOptions: { targetName: CP_TARGET_NAME },
      }),
    );
  });

  it('should normalize context with custom target name', async () => {
    const projectRoot = 'libs/my-lib';
    const customTargetName = 'custom-target';
    setupProjectJson({
      projectRoot,
      config: { name: 'my-lib', root: projectRoot, targets: {} },
    });

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(projectRoot),
        { targetName: customTargetName },
      ),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        projectRoot: expect.pathToMatch(`${MEMFS_VOLUME}/${projectRoot}`),
        projectJson: { name: 'my-lib', root: projectRoot, targets: {} },
        createOptions: { targetName: customTargetName },
      }),
    );
  });

  it('should extract project root from project.json path', async () => {
    const projectRoot = 'packages/utils';
    setupProjectJson({
      projectRoot,
      config: { name: 'utils', root: projectRoot, targets: {} },
    });

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(projectRoot),
      ),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        projectRoot: expect.pathToMatch(`${MEMFS_VOLUME}/${projectRoot}`),
      }),
    );
  });

  it('should preserve all context properties', async () => {
    const projectRoot = 'libs/my-lib';
    const nxJsonConfiguration = {
      namedInputs: { default: ['{projectRoot}/**/*'] },
    };
    setupProjectJson({
      projectRoot,
      config: { name: 'my-lib', root: projectRoot, targets: {} },
    });

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({
          workspaceRoot: MEMFS_VOLUME,
          nxJsonConfiguration,
        }),
        projectJsonPath(projectRoot),
      ),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        projectRoot: expect.pathToMatch(`${MEMFS_VOLUME}/${projectRoot}`),
        workspaceRoot: MEMFS_VOLUME,
        nxJsonConfiguration,
        projectJson: { name: 'my-lib', root: projectRoot, targets: {} },
        createOptions: { targetName: CP_TARGET_NAME },
      }),
    );
  });

  it('should preserve createOptions properties', async () => {
    const projectRoot = 'libs/my-lib';
    const createOptions = {
      targetName: 'custom-target',
      projectPrefix: 'cli',
      bin: 'packages/cli/dist',
    };
    setupProjectJson({
      projectRoot,
      config: { name: 'my-lib', root: projectRoot, targets: {} },
    });

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(projectRoot),
        createOptions,
      ),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        createOptions,
      }),
    );
  });

  it('should throw error when project.json file cannot be read', async () => {
    const projectRoot = 'libs/my-lib';
    vol.fromJSON({}, MEMFS_VOLUME);

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(projectRoot),
      ),
    ).rejects.toThrow(
      `Error parsing project.json file ${projectJsonPath(projectRoot)}.`,
    );
  });

  it('should throw error when project.json contains invalid JSON', async () => {
    const projectRoot = 'libs/my-lib';
    vol.fromJSON(
      {
        [`${projectRoot}/project.json`]: '{ invalid json }',
      },
      MEMFS_VOLUME,
    );

    await expect(
      normalizedCreateNodesV2Context(
        createNodesV2Context({ workspaceRoot: MEMFS_VOLUME }),
        projectJsonPath(projectRoot),
      ),
    ).rejects.toThrow(
      `Error parsing project.json file ${projectJsonPath(projectRoot)}.`,
    );
  });
});
