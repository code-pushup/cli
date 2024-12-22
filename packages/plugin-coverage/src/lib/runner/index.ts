import { bold } from 'ansis';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AuditOutputs, RunnerConfig } from '@code-pushup/models';
import {
  ProcessError,
  ensureDirectoryExists,
  executeProcess,
  filePathToCliArg,
  readJsonFile,
  ui,
} from '@code-pushup/utils';
import type { FinalCoveragePluginConfig } from '../config.js';
import { applyMaxScoreAboveThreshold } from '../utils.js';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants.js';
import { lcovResultsToAuditOutputs } from './lcov/lcov-runner.js';

export async function executeRunner(): Promise<void> {
  const { reports, coverageToolCommand, coverageTypes } =
    await readJsonFile<FinalCoveragePluginConfig>(PLUGIN_CONFIG_PATH);

  // Run coverage tool if provided
  if (coverageToolCommand != null) {
    const { command, args } = coverageToolCommand;
    try {
      await executeProcess({ command, args });
    } catch (error) {
      if (error instanceof ProcessError) {
        ui().logger.error(bold('stdout from failed coverage tool process:'));
        ui().logger.error(error.stdout);
        ui().logger.error(bold('stderr from failed coverage tool process:'));
        ui().logger.error(error.stderr);
      }

      throw new Error(
        'Coverage plugin: Running coverage tool failed. Make sure all your provided tests are passing.',
      );
    }
  }

  // Calculate coverage from LCOV results
  const auditOutputs = await lcovResultsToAuditOutputs(reports, coverageTypes);

  await ensureDirectoryExists(path.dirname(RUNNER_OUTPUT_PATH));
  await writeFile(RUNNER_OUTPUT_PATH, JSON.stringify(auditOutputs));
}

export async function createRunnerConfig(
  scriptPath: string,
  config: FinalCoveragePluginConfig,
): Promise<RunnerConfig> {
  // Create JSON config for executeRunner
  await ensureDirectoryExists(path.dirname(PLUGIN_CONFIG_PATH));
  await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));

  const threshold = config.perfectScoreThreshold;

  return {
    command: 'node',
    args: [filePathToCliArg(scriptPath)],
    outputFile: RUNNER_OUTPUT_PATH,
    ...(threshold != null && {
      outputTransform: outputs =>
        applyMaxScoreAboveThreshold(outputs as AuditOutputs, threshold),
    }),
  };
}
