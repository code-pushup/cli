import { bold } from 'ansis';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AuditOutput, RunnerConfig } from '@code-pushup/models';
import {
  ProcessError,
  ensureDirectoryExists,
  executeProcess,
  filePathToCliArg,
  readJsonFile,
  ui,
} from '@code-pushup/utils';
import type { DocCoveragePluginConfig } from '../config.js';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants.js';

export { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants.js';

export async function executeRunner(): Promise<void> {
  const { outputPath, coverageToolCommand } =
    await readJsonFile<DocCoveragePluginConfig>(PLUGIN_CONFIG_PATH);
  if (coverageToolCommand != null) {
    const { command, args = [] } = coverageToolCommand;
    try {
      await executeProcess({ command, args });
    } catch (error) {
      if (error instanceof ProcessError) {
        ui().logger.error(bold('stdout from failed Compodoc process:'));
        ui().logger.error(error.stdout);
        ui().logger.error(bold('stderr from failed Compodoc process:'));
        ui().logger.error(error.stderr);
      }
      throw new Error(
        'Doc Coverage plugin: Running Compodoc failed. Please check the error above.',
      );
    }
  }

  try {
    // From the output of Compodoc, we can get the coverage percentage.
    const docData: { coverage: { count: number } } =
      await readJsonFile(outputPath);
    const coverage = docData.coverage.count || 0;

    const auditOutputs: AuditOutput[] = [
      {
        slug: 'percentage-coverage',
        value: coverage,
        score: coverage / 100,
        displayValue: `${coverage} %`,
      },
    ];

    await ensureDirectoryExists(path.dirname(RUNNER_OUTPUT_PATH));
    await writeFile(RUNNER_OUTPUT_PATH, JSON.stringify(auditOutputs));
  } catch (error) {
    if (error instanceof ProcessError) {
      ui().logger.error(bold('stdout from failed coverage tool process:'));
      ui().logger.error(error.stdout);
      ui().logger.error(bold('stderr from failed coverage tool process:'));
      ui().logger.error(error.stderr);

      throw new Error(
        'Doc Coverage plugin: Running Compodoc failed. Please check the error above.',
      );
    }
  }
}

export async function createRunnerConfig(
  scriptPath: string,
  config: DocCoveragePluginConfig,
): Promise<RunnerConfig> {
  // Create JSON config for executeRunner
  await ensureDirectoryExists(path.dirname(PLUGIN_CONFIG_PATH));
  await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));

  return {
    command: 'node',
    args: [filePathToCliArg(scriptPath)],
    outputFile: RUNNER_OUTPUT_PATH,
  };
}
