import { readFile } from 'node:fs/promises';
import {
  type MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { MEMFS_VOLUME, osAgnosticPath } from '@code-pushup/test-utils';
import { normalizedCreateNodesV2Context } from '../../plugin/utils.js';
import type { Command } from '../internal/types.js';
import {
  parseCliExecutorOnlyOptions,
  parseCliExecutorOptions,
  parsePrintConfigExecutorOptions,
} from './utils.js';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should normalize context with default target name', async () => {
    const projectJsonPath = `${MEMFS_VOLUME}/libs/my-lib/project.json`;
    const projectJsonContent = JSON.stringify({
      name: 'my-lib',
      root: 'libs/my-lib',
      targets: {},
    });

    // Mock readFile
    vi.mocked(readFile).mockResolvedValue(Buffer.from(projectJsonContent));

    const context = {
      nxJsonConfiguration: {},
      configFiles: [],
      workspaceRoot: MEMFS_VOLUME,
    };

    const result = await normalizedCreateNodesV2Context(
      context,
      projectJsonPath,
    );

    expect(result).toEqual({
      ...context,
      projectJson: {
        name: 'my-lib',
        root: 'libs/my-lib',
        targets: {},
      },
      projectRoot: expect.any(String),
      createOptions: {
        targetName: CP_TARGET_NAME,
      },
    });
    expect(osAgnosticPath(result.projectRoot)).toBe(
      osAgnosticPath(`${MEMFS_VOLUME}/libs/my-lib`),
    );

    expect(readFile).toHaveBeenCalledWith(projectJsonPath);
  });

  it('should normalize context with custom target name', async () => {
    const projectJsonPath = `${MEMFS_VOLUME}/libs/my-lib/project.json`;
    const projectJsonContent = JSON.stringify({
      name: 'my-lib',
      root: 'libs/my-lib',
      targets: {},
    });

    const customTargetName = 'custom-target';

    // Mock readFile
    vi.mocked(readFile).mockResolvedValue(Buffer.from(projectJsonContent));

    const context = {
      nxJsonConfiguration: {},
      configFiles: [],
      workspaceRoot: MEMFS_VOLUME,
    };

    const result = await normalizedCreateNodesV2Context(
      context,
      projectJsonPath,
      {
        targetName: customTargetName,
      },
    );

    expect(result).toEqual({
      ...context,
      projectJson: {
        name: 'my-lib',
        root: 'libs/my-lib',
        targets: {},
      },
      projectRoot: expect.any(String),
      createOptions: {
        targetName: customTargetName,
      },
    });
    expect(osAgnosticPath(result.projectRoot)).toBe(
      osAgnosticPath(`${MEMFS_VOLUME}/libs/my-lib`),
    );
  });

  it('should extract project root from project.json path', async () => {
    const projectJsonPath = `${MEMFS_VOLUME}/packages/utils/project.json`;
    const projectJsonContent = JSON.stringify({
      name: 'utils',
      root: 'packages/utils',
      targets: {},
    });

    // Mock readFile
    vi.mocked(readFile).mockResolvedValue(Buffer.from(projectJsonContent));

    const context = {
      nxJsonConfiguration: {},
      configFiles: [],
      workspaceRoot: MEMFS_VOLUME,
    };

    const result = await normalizedCreateNodesV2Context(
      context,
      projectJsonPath,
    );

    expect(osAgnosticPath(result.projectRoot)).toBe(
      osAgnosticPath(`${MEMFS_VOLUME}/packages/utils`),
    );
  });

  it('should preserve all context properties', async () => {
    const projectJsonPath = `${MEMFS_VOLUME}/libs/my-lib/project.json`;
    const projectJsonContent = JSON.stringify({
      name: 'my-lib',
      root: 'libs/my-lib',
      targets: {},
    });

    // Mock readFile
    vi.mocked(readFile).mockResolvedValue(Buffer.from(projectJsonContent));

    const context = {
      nxJsonConfiguration: { namedInputs: { default: ['{projectRoot}/**/*'] } },
      workspaceRoot: MEMFS_VOLUME,
    };

    const result = await normalizedCreateNodesV2Context(
      context,
      projectJsonPath,
    );

    expect(result.nxJsonConfiguration).toEqual(context.nxJsonConfiguration);
    expect(result.workspaceRoot).toBe(context.workspaceRoot);
    expect(result.projectJson).toBeDefined();
    expect(result.projectRoot).toBeDefined();
    expect(result.createOptions).toBeDefined();
  });

  it('should preserve createOptions properties', async () => {
    const projectJsonPath = `${MEMFS_VOLUME}/libs/my-lib/project.json`;
    const projectJsonContent = JSON.stringify({
      name: 'my-lib',
      root: 'libs/my-lib',
      targets: {},
    });

    // Mock readFile
    vi.mocked(readFile).mockResolvedValue(Buffer.from(projectJsonContent));

    const context = {
      nxJsonConfiguration: {},
      configFiles: [],
      workspaceRoot: MEMFS_VOLUME,
    };

    const createOptions = {
      targetName: 'custom-target',
      projectPrefix: 'cli',
      bin: 'packages/cli/dist',
    };

    const result = await normalizedCreateNodesV2Context(
      context,
      projectJsonPath,
      createOptions,
    );

    expect(result.createOptions).toEqual({
      ...createOptions,
      targetName: 'custom-target',
    });
  });

  it('should throw error when project.json file cannot be read', async () => {
    const projectJsonPath = `${MEMFS_VOLUME}/libs/my-lib/project.json`;

    // Mock readFile to throw error
    vi.mocked(readFile).mockRejectedValue(new Error('File not found'));

    const context = {
      nxJsonConfiguration: {},
      configFiles: [],
      workspaceRoot: MEMFS_VOLUME,
    };

    await expect(
      normalizedCreateNodesV2Context(context, projectJsonPath),
    ).rejects.toThrow(`Error parsing project.json file ${projectJsonPath}.`);
  });

  it('should throw error when project.json contains invalid JSON', async () => {
    const projectJsonPath = `${MEMFS_VOLUME}/libs/my-lib/project.json`;
    const invalidJson = '{ invalid json }';

    // Mock readFile
    vi.mocked(readFile).mockResolvedValue(Buffer.from(invalidJson));

    const context = {
      nxJsonConfiguration: {},
      configFiles: [],
      workspaceRoot: MEMFS_VOLUME,
    };

    await expect(
      normalizedCreateNodesV2Context(context, projectJsonPath),
    ).rejects.toThrow(`Error parsing project.json file ${projectJsonPath}.`);
  });
});
