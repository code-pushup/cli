import { writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { AuditOutputs, RunnerConfig } from '@code-pushup/models';
import {
  ensureDirectoryExists,
  executeProcess,
  readJsonFile,
} from '@code-pushup/utils';
import { FinalCoveragePluginConfig } from '../config';
import { applyMaxScoreAboveThreshold } from '../utils';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH, WORKDIR } from './constants';
import { lcovResultsToAuditOutputs } from './lcov/lcov-runner';

export async function executeRunner(): Promise<void> {
  const { reports, coverageToolCommand, coverageTypes } =
    await readJsonFile<FinalCoveragePluginConfig>(PLUGIN_CONFIG_PATH);

  // Run coverage tool if provided
  if (coverageToolCommand != null) {
    const { command, args } = coverageToolCommand;
    await executeProcess({ command, args });
  }

  // Caculate coverage from LCOV results
  const auditOutputs = await lcovResultsToAuditOutputs(reports, coverageTypes);

  await ensureDirectoryExists(dirname(RUNNER_OUTPUT_PATH));
  await writeFile(RUNNER_OUTPUT_PATH, JSON.stringify(auditOutputs));
}

export async function createRunnerConfig(
  scriptPath: string,
  config: FinalCoveragePluginConfig,
): Promise<RunnerConfig> {
  // Create JSON config for executeRunner
  await ensureDirectoryExists(WORKDIR);
  await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));

  const threshold = config.perfectScoreThreshold;

  return {
    command: 'node',
    args: [scriptPath],
    outputFile: RUNNER_OUTPUT_PATH,
    ...(threshold != null && {
      outputTransform: outputs =>
        applyMaxScoreAboveThreshold(outputs as AuditOutputs, threshold),
    }),
  };
}
