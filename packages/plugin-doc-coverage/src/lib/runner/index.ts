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
import {
  COMMANDS_FOR_LANGUAGES,
  DEFAULT_OUTPUT_FOLDER_PATH,
  DEFAULT_SOURCE_GLOB,
  PLUGIN_CONFIG_PATH,
  ProgrammingLanguage,
  RUNNER_OUTPUT_PATH,
  type TypedocResult,
} from './constants.js';

export { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants.js';

/**
 * Execute the Typedoc process.
 * @param config - The configuration for the Typedoc process.
 */
async function _executeTypedocProcess(
  config: DocCoveragePluginConfig,
): Promise<void> {
  const {
    sourceGlob,
    language,
    outputFolderPath = DEFAULT_OUTPUT_FOLDER_PATH,
  } = config;
  const { args: originalArgs } = COMMANDS_FOR_LANGUAGES[language];
  const processedArgs =
    language === ProgrammingLanguage.TypeScript
      ? originalArgs
          .replace('$outputFolderPath', outputFolderPath)
          .replace('$sourceGlob', sourceGlob || DEFAULT_SOURCE_GLOB[language])
      : originalArgs;

  try {
    await executeProcess({
      command: COMMANDS_FOR_LANGUAGES[language].command,
      args: processedArgs.split(' '),
    });
  } catch (error) {
    if (error instanceof ProcessError) {
      ui().logger.error(bold('stdout from failed Typedoc process:'));
      ui().logger.error(error.stdout);
      ui().logger.error(bold('stderr from failed Typedoc process:'));
      ui().logger.error(error.stderr);
    }
    throw new Error(
      'Doc Coverage plugin: Running Typedoc failed. Please check the error above.',
    );
  }
}

/**
 * Process the Typedoc results.
 * @param outputFolderPath - The path to the output folder.
 */
async function _processTypedocResults(outputFolderPath: string): Promise<void> {
  try {
    const docData: TypedocResult = await readJsonFile(
      path.join(outputFolderPath, 'coverage.json'),
    );
    const coverage = docData.percent || 0;
    const auditOutputs: AuditOutput[] = [
      {
        slug: 'percentage-coverage',
        value: coverage,
        score: coverage / 100,
        displayValue: `${coverage} %`,
        details: {
          issues: docData.notDocumented.map(file => ({
            message: 'Missing documentation',
            source: { file },
            severity: 'warning',
          })),
        },
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

export async function executeRunner(): Promise<void> {
  const config =
    await readJsonFile<DocCoveragePluginConfig>(PLUGIN_CONFIG_PATH);
  await _executeTypedocProcess(config);
  await _processTypedocResults(
    config.outputFolderPath || DEFAULT_OUTPUT_FOLDER_PATH,
  );
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
