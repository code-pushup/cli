import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RunnerConfig, RunnerFilesPaths } from '@code-pushup/models';
import {
  createRunnerFiles,
  ensureDirectoryExists,
  executeProcess,
  filePathToCliArg,
  objectToCliArgs,
  readJsonFile,
} from '@code-pushup/utils';
import type { FinalCoveragePluginConfig } from '../config.js';
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

  return {
    command: 'node',
    args: [
      filePathToCliArg(scriptPath),
      ...objectToCliArgs({ runnerConfigPath, runnerOutputPath }),
    ],
    configFile: runnerConfigPath,
    outputFile: runnerOutputPath,
  };
}
