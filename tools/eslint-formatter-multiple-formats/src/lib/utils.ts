import type { ESLint } from 'eslint';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { stringifyError } from '@code-pushup/utils';
import type { EslintFormat, FormatterConfig } from './types.js';

// Import the stylish formatter - using require, otherwise there is the wrong typing
const stylishFormatter = require('eslint-formatter-stylish') as (
  results: ESLint.LintResult[],
) => string;

export function getExtensionForFormat(format: EslintFormat): string {
  const extensionMap: Record<string, string> = {
    json: 'json',
    stylish: 'txt',
  };

  return extensionMap[format] || 'txt';
}

export function findConfigFromEnv(
  env: NodeJS.ProcessEnv,
): FormatterConfig | null {
  const configString = env['ESLINT_FORMATTER_CONFIG'];

  if (!configString || configString.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(configString) as FormatterConfig;
  } catch (error) {
    console.error(
      'Error parsing ESLINT_FORMATTER_CONFIG environment variable:',
      stringifyError(error),
    );
    return null;
  }
}

export type PersistConfig = {
  outputDir: string;
  filename: string;
  format: EslintFormat;
  verbose?: boolean;
};

function formatJson(results: ESLint.LintResult[]): string {
  return JSON.stringify(results, null, 2);
}

export function formatContent(
  results: ESLint.LintResult[],
  format: EslintFormat,
): string {
  switch (format) {
    case 'json':
      return formatJson(results);
    case 'stylish':
      return stylishFormatter(results);
    default:
      return stylishFormatter(results);
  }
}

export function formatTerminalOutput(
  format: EslintFormat | undefined,
  results: ESLint.LintResult[],
): string {
  if (!format) {
    return '';
  }
  return formatContent(results, format);
}

export function persistEslintReport(
  results: ESLint.LintResult[],
  options: PersistConfig,
): boolean {
  const { outputDir, filename, format, verbose = false } = options;
  try {
    // eslint-disable-next-line n/no-sync
    mkdirSync(outputDir, { recursive: true });
    // eslint-disable-next-line n/no-sync
    writeFileSync(
      path.join(outputDir, `${filename}.${getExtensionForFormat(format)}`),
      formatContent(results, format),
    );
    if (verbose) {
      console.info(`ESLint report (${format}) written to: ${outputDir}`);
    }
    return true;
  } catch (error) {
    if (verbose) {
      console.error(
        'There was a problem writing the output file:\n%s',
        stringifyError(error),
      );
    }
    return false;
  }
}

export function persistEslintReports(
  formats: EslintFormat[],
  results: ESLint.LintResult[],
  options: { outputDir: string; filename: string; verbose: boolean },
): boolean {
  const { outputDir, filename, verbose } = options;

  return formats.every(format =>
    persistEslintReport(results, {
      outputDir,
      filename,
      format,
      verbose,
    }),
  );
}
