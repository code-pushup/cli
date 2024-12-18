import { bold } from 'ansis';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AuditOutput, RunnerConfig } from '@code-pushup/models';
import {
  ProcessError,
  ensureDirectoryExists,
  filePathToCliArg,
  readJsonFile,
  ui,
} from '@code-pushup/utils';
import type { DocCoveragePluginConfig } from '../config.js';
import type { CoverageResult } from '../models.js';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants.js';
import { processDocCoverage } from './doc-processer.js';

export { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants.js';

export async function executeRunner(): Promise<void> {
  try {
    const config =
      await readJsonFile<DocCoveragePluginConfig>(PLUGIN_CONFIG_PATH);
    console.log(config.sourceGlob, 'dadawdawd');
    const processResult = processDocCoverage(config.sourceGlob);
    await _createFinalReport(processResult);
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

export async function createRunnerConfig(
  scriptPath: string,
  config: DocCoveragePluginConfig,
): Promise<RunnerConfig> {
  await ensureDirectoryExists(path.dirname(PLUGIN_CONFIG_PATH));
  await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));

  return {
    command: 'node',
    args: [filePathToCliArg(scriptPath)],
    outputFile: RUNNER_OUTPUT_PATH,
  };
}

/**
 * Create the final report.
 * @param coverageResult - The coverage result.
 */
async function _createFinalReport(
  coverageResult: CoverageResult,
): Promise<void> {
  const auditOutputs: AuditOutput[] = [
    {
      slug: 'percentage-coverage',
      value: coverageResult.currentCoverage,
      score: coverageResult.currentCoverage / 100,
      displayValue: `${coverageResult.currentCoverage} %`,
      details: {
        issues: coverageResult.undocumentedItems.map(item => ({
          message: `Missing documentation for a ${item.type}`,
          source: { file: item.file, position: { startLine: item.line } },
          severity: 'warning',
        })),
      },
    },
  ];

  await ensureDirectoryExists(path.dirname(RUNNER_OUTPUT_PATH));
  await writeFile(RUNNER_OUTPUT_PATH, JSON.stringify(auditOutputs));
}
