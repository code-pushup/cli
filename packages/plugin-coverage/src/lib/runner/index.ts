import { bold } from 'ansis';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  AuditOutputs,
  RunnerConfig,
  RunnerFilesPaths,
} from '@code-pushup/models';
import {
  ProcessError,
  createRunnerFiles,
  ensureDirectoryExists,
  executeProcess,
  filePathToCliArg,
  objectToCliArgs,
  readJsonFile,
  ui,
} from '@code-pushup/utils';
import type { FinalCoveragePluginConfig } from '../config.js';
import { applyMaxScoreAboveThreshold } from '../utils.js';
import { lcovResultsToAuditOutputs } from './lcov/lcov-runner.js';

export async function executeRunner({
  runnerConfigPath,
  runnerOutputPath,
}: RunnerFilesPaths): Promise<void> {
  const { reports, coverageToolCommand, continueOnCommandFail, coverageTypes } =
    await readJsonFile<FinalCoveragePluginConfig>(runnerConfigPath);

  // Run coverage tool if provided
  if (coverageToolCommand != null) {
    const { command, args } = coverageToolCommand;
    try {
      await executeProcess({ command, args });
    } catch (error) {
      if (error instanceof ProcessError) {
        const loggingFn = continueOnCommandFail
          ? ui().logger.warning.bind(ui().logger)
          : ui().logger.error.bind(ui().logger);
        loggingFn(bold('stdout from failed coverage tool process:'));
        loggingFn(error.stdout);
        loggingFn(bold('stderr from failed coverage tool process:'));
        loggingFn(error.stderr);
      }

      if (!continueOnCommandFail) {
        throw new Error(
          'Coverage plugin: Running coverage tool failed. Make sure all your provided tests are passing.',
        );
      }
    }
  }

  // Calculate coverage from LCOV results
  const auditOutputs = await lcovResultsToAuditOutputs(reports, coverageTypes);

  await ensureDirectoryExists(path.dirname(runnerOutputPath));
  await writeFile(runnerOutputPath, JSON.stringify(auditOutputs));
}

export async function createRunnerConfig(
  scriptPath: string,
  config: FinalCoveragePluginConfig,
): Promise<RunnerConfig> {
  // Create JSON config for executeRunner
  const { runnerConfigPath, runnerOutputPath } = await createRunnerFiles(
    'coverage',
    JSON.stringify(config),
  );

  const threshold = config.perfectScoreThreshold;

  return {
    command: 'node',
    args: [
      filePathToCliArg(scriptPath),
      ...objectToCliArgs({ runnerConfigPath, runnerOutputPath }),
    ],
    configFile: runnerConfigPath,
    outputFile: runnerOutputPath,
    ...(threshold != null && {
      outputTransform: outputs =>
        applyMaxScoreAboveThreshold(outputs as AuditOutputs, threshold),
    }),
  };
}
