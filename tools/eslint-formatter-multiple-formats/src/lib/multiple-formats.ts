import type { ESLint } from 'eslint';
import path from 'node:path';
import * as process from 'node:process';
import type { FormatterConfig } from './types.js';
import type { EslintFormat } from './utils.js';
import {
  formatTerminalOutput,
  findConfigFromEnv as getConfigFromEnv,
  persistEslintReports,
} from './utils.js';

export const DEFAULT_OUTPUT_DIR = '.eslint';
export const DEFAULT_FILENAME = 'eslint-report';
export const DEFAULT_FORMATS = ['json'] as EslintFormat[];
export const DEFAULT_TERMINAL = 'stylish' as EslintFormat;

export const DEFAULT_CONFIG: Required<
  Pick<
    FormatterConfig,
    'outputDir' | 'filename' | 'formats' | 'terminal' | 'verbose'
  >
> = {
  outputDir: DEFAULT_OUTPUT_DIR,
  filename: DEFAULT_FILENAME,
  formats: DEFAULT_FORMATS,
  terminal: DEFAULT_TERMINAL,
  verbose: false,
};

/**
 * Format ESLint results using multiple configurable formatters
 *
 * @param results - The ESLint results
 * @param args - The arguments passed to the formatter
 * @returns The formatted results for terminal display
 *
 * @example
 * // Basic usage:
 * ESLINT_FORMATTER_CONFIG='{"filename":"lint-results","formats":["json"],"terminal":"stylish"}' npx eslint .
 * // Creates: .eslint/eslint-results.json + terminal output
 *
 * // With custom output directory:
 * ESLINT_FORMATTER_CONFIG='{"outputDir":"./ci-reports","filename":"eslint-report","formats":["json","html"],"terminal":"stylish"}' nx lint utils
 * // Creates: ci-reports/eslint-report.json, ci-reports/eslint-report.html + terminal output
 *
 * Configuration schema:
 * {
 *   "outputDir": "./reports",           // Optional: Output directory (default: cwd/.eslint)
 *   "filename": "eslint-report",        // Optional: Base filename without extension (default: 'eslint-report')
 *   "formats": ["json"],        // Optional: Array of format names for file output (default: ['json'])
 *   "terminal": "stylish"               // Optional: Format for terminal output (default: 'stylish')
 * }
 */
export default function multipleFormats(
  results: ESLint.LintResult[],
  _args?: unknown,
): string {
  const config = {
    ...DEFAULT_CONFIG,
    ...getConfigFromEnv(process.env),
  } satisfies FormatterConfig;

  const {
    outputDir = DEFAULT_OUTPUT_DIR,
    projectsDir,
    projectName = process.env['NX_TASK_TARGET_PROJECT'],
    filename,
    formats,
    terminal,
    verbose = false,
  } = config;

  const filalOutputDir =
    typeof projectName === 'string' && typeof projectsDir === 'string'
      ? path.join(projectsDir ?? '', projectName ?? '', outputDir)
      : outputDir;

  try {
    persistEslintReports(formats, results, {
      outputDir: filalOutputDir,
      filename,
      verbose,
    });
  } catch (error) {
    if (verbose) {
      console.error('Error writing ESLint reports:', error);
    }
  }

  return formatTerminalOutput(terminal, results);
}
