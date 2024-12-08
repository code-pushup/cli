import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';
import type {
  AuditOutput,
  AuditOutputs,
  RunnerConfig,
} from '@code-pushup/models';
import { readJsonFile, removeDirectoryIfExists } from '@code-pushup/utils';
import { createRunnerConfig, executeRunner } from '.';
import type { FinalCoveragePluginConfig } from '../config.js';
import {
  PLUGIN_CONFIG_PATH,
  RUNNER_OUTPUT_PATH,
  WORKDIR,
} from './constants.js';

describe('createRunnerConfig', () => {
  it('should create a valid runner config', async () => {
    const runnerConfig = await createRunnerConfig('executeRunner.ts', {
      reports: ['coverage/lcov.info'],
      coverageTypes: ['branch'],
      perfectScoreThreshold: 85,
    });
    expect(runnerConfig).toStrictEqual<RunnerConfig>({
      command: 'node',
      args: ['"executeRunner.ts"'],
      outputTransform: expect.any(Function),
      outputFile: expect.stringContaining('runner-output.json'),
    });
  });

  it('should provide plugin config to runner in JSON file', async () => {
    await removeDirectoryIfExists(WORKDIR);

    const pluginConfig: FinalCoveragePluginConfig = {
      coverageTypes: ['line'],
      reports: ['coverage/lcov.info'],
      coverageToolCommand: { command: 'npm', args: ['run', 'test'] },
      perfectScoreThreshold: 85,
    };

    await createRunnerConfig('executeRunner.ts', pluginConfig);

    const config =
      await readJsonFile<FinalCoveragePluginConfig>(PLUGIN_CONFIG_PATH);
    expect(config).toStrictEqual(pluginConfig);
  });
});

describe('executeRunner', () => {
  it('should successfully execute runner', async () => {
    const config: FinalCoveragePluginConfig = {
      reports: [
        join(
          fileURLToPath(dirname(import.meta.url)),
          '..',
          '..',
          '..',
          'mocks',
          'single-record-lcov.info',
        ),
      ],
      coverageTypes: ['line'],
    };

    await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));
    await executeRunner();

    const results = await readJsonFile<AuditOutputs>(RUNNER_OUTPUT_PATH);
    expect(results).toStrictEqual([
      expect.objectContaining({
        slug: 'line-coverage',
        score: 0.7,
        value: 70,
        details: {
          issues: [
            expect.objectContaining({
              message: 'Lines 7-9 are not covered in any test case.',
            }),
          ],
        },
      } satisfies AuditOutput),
    ]);
  });
});
