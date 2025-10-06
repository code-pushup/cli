import { vol } from 'memfs';
import {
  type AuditOutputs,
  DEFAULT_PERSIST_CONFIG,
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
  DEFAULT_PERSIST_SKIP_REPORT,
  auditOutputsSchema,
} from '@code-pushup/models';
import {
  ISO_STRING_REGEXP,
  MEMFS_VOLUME,
  MINIMAL_PLUGIN_CONFIG_MOCK,
  MINIMAL_RUNNER_CONFIG_MOCK,
  MINIMAL_RUNNER_FUNCTION_MOCK,
  osAgnosticPath,
} from '@code-pushup/test-utils';
import * as utils from '@code-pushup/utils';
import {
  type RunnerResult,
  executePluginRunner,
  executeRunnerConfig,
  executeRunnerFunction,
  getRunnerOutputsPath,
} from './runner.js';

describe('getRunnerOutputsPath', () => {
  it('should read runner results from a file', async () => {
    expect(
      osAgnosticPath(getRunnerOutputsPath('plugin-with-cache', 'output')),
    ).toBe(osAgnosticPath('output/plugin-with-cache/runner-output.json'));
  });
});

describe('executeRunnerConfig', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'output.json': JSON.stringify([
          {
            slug: 'node-version',
            score: 0.3,
            value: 16,
          },
        ]),
      },
      MEMFS_VOLUME,
    );

    vi.spyOn(utils, 'executeProcess');
  });

  it('should execute valid runner config', async () => {
    const runnerResult = await executeRunnerConfig(MINIMAL_RUNNER_CONFIG_MOCK, {
      persist: DEFAULT_PERSIST_CONFIG,
    });

    // data sanity
    expect((runnerResult.audits as AuditOutputs)[0]?.slug).toBe('node-version');
    expect(runnerResult.date).toMatch(ISO_STRING_REGEXP);
    expect(runnerResult.duration).toBeGreaterThanOrEqual(0);

    // schema validation
    expect(() => auditOutputsSchema.parse(runnerResult.audits)).not.toThrow();

    // executed process configuration
    expect(utils.executeProcess).toHaveBeenCalledWith<[utils.ProcessConfig]>({
      command: 'node',
      args: ['-v'],
      env: expect.objectContaining({
        CP_PERSIST_OUTPUT_DIR: DEFAULT_PERSIST_OUTPUT_DIR,
        CP_PERSIST_FILENAME: DEFAULT_PERSIST_FILENAME,
        CP_PERSIST_FORMAT: DEFAULT_PERSIST_FORMAT.join(','),
        CP_PERSIST_SKIP_REPORTS: `${DEFAULT_PERSIST_SKIP_REPORT}`,
      }),
      observer: {
        onStdout: expect.any(Function),
        onStderr: expect.any(Function),
      },
      verbose: false,
    });
  });

  it('should use outputTransform when provided', async () => {
    const runnerResult = await executeRunnerConfig(
      {
        command: 'node',
        args: ['-v'],
        outputFile: 'output.json',
        outputTransform: (outputs: unknown): Promise<AuditOutputs> =>
          Promise.resolve([
            {
              slug: (outputs as AuditOutputs)[0]!.slug,
              score: 0.3,
              value: 16,
              displayValue: '16.0.0',
            },
          ]),
      },
      { persist: DEFAULT_PERSIST_CONFIG },
    );
    const auditOutputs = runnerResult.audits as AuditOutputs;

    expect(auditOutputs[0]?.slug).toBe('node-version');
    expect(auditOutputs[0]?.displayValue).toBe('16.0.0');
  });

  it('should throw if outputTransform throws', async () => {
    await expect(
      executeRunnerConfig(
        {
          command: 'node',
          args: ['-v'],
          outputFile: 'output.json',
          outputTransform: () =>
            Promise.reject(new Error('Error: outputTransform has failed.')),
        },
        { persist: DEFAULT_PERSIST_CONFIG },
      ),
    ).rejects.toThrow('Error: outputTransform has failed.');
  });
});

describe('executeRunnerFunction', () => {
  it('should execute a valid runner function', async () => {
    const runnerResult: RunnerResult = await executeRunnerFunction(
      MINIMAL_RUNNER_FUNCTION_MOCK,
      { persist: DEFAULT_PERSIST_CONFIG },
    );
    const auditOutputs = runnerResult.audits as AuditOutputs;

    expect(auditOutputs[0]?.slug).toBe('node-version');
    expect(auditOutputs[0]?.details?.issues).toEqual([
      expect.objectContaining({
        message: 'The required Node version to run Code PushUp CLI is 18.',
      }),
    ]);
  });

  it('should throw if the runner function throws', async () => {
    await expect(
      executeRunnerFunction(
        () => Promise.reject(new Error('Error: Runner has failed.')),
        { persist: DEFAULT_PERSIST_CONFIG },
      ),
    ).rejects.toThrow('Error: Runner has failed.');
  });

  it('should throw with an invalid runner type', async () => {
    await expect(
      // @ts-expect-error Testing a use case with invalid type passed as a function.
      executeRunnerFunction(''),
    ).rejects.toThrow('runner is not a function');
  });
});

describe('executePluginRunner', () => {
  it('should execute a valid plugin config', async () => {
    const pluginResult = await executePluginRunner(MINIMAL_PLUGIN_CONFIG_MOCK, {
      persist: DEFAULT_PERSIST_CONFIG,
    });
    expect(pluginResult.audits[0]?.slug).toBe('node-version');
  });

  it('should yield audit outputs for valid runner config', async () => {
    vol.fromJSON(
      {
        'output.json': JSON.stringify([
          {
            slug: 'node-version',
            score: 0.3,
            value: 16,
          },
        ]),
      },
      MEMFS_VOLUME,
    );

    await expect(
      executePluginRunner(
        {
          ...MINIMAL_PLUGIN_CONFIG_MOCK,
          runner: {
            command: 'node',
            args: ['-v'],
            outputFile: 'output.json',
          },
        },
        { persist: DEFAULT_PERSIST_CONFIG },
      ),
    ).resolves.toStrictEqual({
      duration: expect.any(Number),
      date: expect.any(String),
      audits: expect.arrayContaining([
        {
          slug: 'node-version',
          score: 0.3,
          value: 16,
        },
      ]),
    });
  });

  it('should yield audit outputs for a valid runner function', async () => {
    await expect(
      executePluginRunner(
        {
          ...MINIMAL_PLUGIN_CONFIG_MOCK,
          runner: () => [
            {
              slug: 'node-version',
              score: 0.3,
              value: 16,
            },
          ],
        },
        { persist: DEFAULT_PERSIST_CONFIG },
      ),
    ).resolves.toStrictEqual({
      duration: expect.any(Number),
      date: expect.any(String),
      audits: expect.arrayContaining([
        {
          slug: 'node-version',
          score: 0.3,
          value: 16,
        },
      ]),
    });
  });
});
