import { ESLint } from 'eslint';
import path from 'node:path';
import type { EslintFormat, FormatterConfig } from './types.js';
import {
  findConfigFromEnv as getConfigFromEnv,
  handleTerminalOutput,
  persistEslintReports,
} from './utils.js';

export const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), '.eslint');
export const DEFAULT_FILENAME = 'eslint-report';
export const DEFAULT_FORMATS = ['json'] as EslintFormat[];
export const DEFAULT_TERMINAL = 'stylish' as EslintFormat;

export const DEFAULT_CONFIG: Required<FormatterConfig> = {
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
 * @returns The formatted results or false if there was an error
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
 *   "terminal": "stylish"               // Optional: Format for terminal output (default: no terminal output)
 * }
 */
export default async function multipleFormats(
  results: ESLint.LintResult[],
  _args?: unknown,
): Promise<string | false> {
  const config = { ...DEFAULT_CONFIG, ...getConfigFromEnv(process.env) };

  const {
    outputDir = DEFAULT_OUTPUT_DIR,
    filename = DEFAULT_FILENAME,
    formats = DEFAULT_FORMATS,
    terminal,
    verbose = false,
  } = config;

  await handleTerminalOutput(terminal, results);

  const success = await persistEslintReports(formats, results, {
    outputDir,
    filename,
    verbose,
  });

  return success ? '' : false;
}
