import type { ESLint } from 'eslint';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stylishFormatter } from './stylish.js';
import type { FormatterConfig } from './types.js';

export function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'Error' || error.message.startsWith(error.name)) {
      return error.message;
    }
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
}

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
    return JSON.parse(configString ?? '{}') as FormatterConfig;
  } catch (error) {
    console.error(
      'Error parsing ESLINT_FORMATTER_CONFIG environment variable:',
      stringifyError(error),
    );
    return null;
  }
}

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

export type EslintFormat = 'stylish' | 'json' | string;

export type PersistConfig = {
  outputDir: string; // e.g. './.eslint' to make paths relative to this folder
  filename: string;
  format: EslintFormat;
  verbose: boolean;
};

export async function persistEslintReport(
  results: ESLint.LintResult[],
  options: PersistConfig,
): Promise<boolean> {
  const { outputDir, filename, format, verbose = false } = options;
  try {
    await mkdir(outputDir, { recursive: true });
    await writeFile(
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

export async function persistEslintReports(
  formats: EslintFormat[],
  results: ESLint.LintResult[],
  options: Omit<PersistConfig, 'format'>,
): Promise<void> {
  const { outputDir, filename, verbose } = options;

  await Promise.all(
    formats.map(format =>
      persistEslintReport(results, {
        outputDir,
        filename,
        format,
        verbose,
      }),
    ),
  );
}
