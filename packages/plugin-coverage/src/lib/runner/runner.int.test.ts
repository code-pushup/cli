import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import type { AuditOutputs, RunnerConfig } from '@code-pushup/models';
import { createRunnerFiles, readJsonFile } from '@code-pushup/utils';
import type { FinalCoveragePluginConfig } from '../config.js';
import { createRunnerConfig, executeRunner } from './index.js';

describe('createRunnerConfig', () => {
  it('should create a valid runner config', async () => {
    const runnerConfig = await createRunnerConfig('executeRunner.ts', {
      reports: ['coverage/lcov.info'],
      coverageTypes: ['branch'],
      scoreTargets: 0.85,
      continueOnCommandFail: true,
    });
    expect(runnerConfig).toStrictEqual<RunnerConfig>({
      command: 'node',
      args: [
        '"executeRunner.ts"',
        expect.stringContaining('plugin-config.json'),
        expect.stringContaining('runner-output.json'),
      ],
      outputFile: expect.stringContaining('runner-output.json'),
      configFile: expect.stringContaining('plugin-config.json'),
    });
  });

  it('should provide plugin config to runner in JSON file', async () => {
    const pluginConfig: FinalCoveragePluginConfig = {
      coverageTypes: ['line'],
      reports: ['coverage/lcov.info'],
      coverageToolCommand: { command: 'npm', args: ['run', 'test'] },
      scoreTargets: 0.85,
      continueOnCommandFail: true,
    };

    const { configFile } = await createRunnerConfig(
      'executeRunner.ts',
      pluginConfig,
    );

    expect(configFile).toMatch(/.*plugin-config\.json$/);
    const config = await readJsonFile<FinalCoveragePluginConfig>(configFile!);
    expect(config).toStrictEqual(pluginConfig);
  });
});

describe('executeRunner', () => {
  it('should successfully execute runner', async () => {
    const config: FinalCoveragePluginConfig = {
      reports: [
        path.join(
          fileURLToPath(path.dirname(import.meta.url)),
          '..',
          '..',
          '..',
          'mocks',
          'single-record-lcov.info',
        ),
      ],
      coverageTypes: ['line'],
      continueOnCommandFail: true,
    };

    const runnerFiles = await createRunnerFiles(
      'coverage',
      JSON.stringify(config),
    );
    await executeRunner(runnerFiles);

    const results = await readJsonFile<AuditOutputs>(
      runnerFiles.runnerOutputPath,
    );
    expect(results).toStrictEqual<AuditOutputs>([
      {
        slug: 'line-coverage',
        score: 0.7,
        value: 70,
        displayValue: '70 %',
        details: {
          trees: [
            {
              type: 'coverage',
              title: 'Line coverage',
              root: {
                name: '.',
                values: { coverage: 0.7 },
                children: [
                  {
                    name: 'src',
                    values: { coverage: 0.7 },
                    children: [
                      {
                        name: 'lib',
                        values: { coverage: 0.7 },
                        children: [
                          {
                            name: 'utils.ts',
                            values: {
                              coverage: 0.7,
                              missing: [{ startLine: 7, endLine: 9 }],
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
    ]);
  });
});
