// Import ansis for colors (similar to chalk)
import { bold, dim, red, reset, underline, yellow } from 'ansis';
import type { ESLint } from 'eslint';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { FormatterConfig } from './types.js';

// Helper function to pluralize words
function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

// Simple function to strip ANSI codes for length calculation
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001B\[[\d;]*m/g, '');
}

// Simple table formatting function
function createTable(
  data: (string | number)[][],
  options: { align?: string[]; stringLength?: (str: string) => number } = {},
): string {
  const { align = [], stringLength = s => s.length } = options;

  if (data.length === 0) {
    return '';
  }

  // Calculate column widths
  const colWidths: number[] = data.reduce<number[]>(
    (widths, row) =>
      row.reduce<number[]>((acc, cell, colIndex) => {
        const cellStr = String(cell);
        const width = stringLength(cellStr);
        const currentWidth = acc[colIndex] || 0;
        const maxWidth = Math.max(currentWidth, width);
        return [
          ...acc.slice(0, colIndex),
          maxWidth,
          ...acc.slice(colIndex + 1),
        ];
      }, widths),
    [],
  );

  // Format rows
  return data
    .map(row =>
      row
        .map((cell, colIndex) => {
          const cellStr = String(cell);
          const width = colWidths[colIndex] || 0;
          const padding = width - stringLength(cellStr);

          if (align[colIndex] === 'r') {
            return ' '.repeat(padding) + cellStr;
          }
          return cellStr + ' '.repeat(padding);
        })
        .join('  '),
    )
    .join('\n');
}

// Summary statistics for lint results
type LintSummary = {
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  summaryColor: 'yellow' | 'red';
};

// Calculate summary statistics from results
function calculateSummary(results: ESLint.LintResult[]): LintSummary {
  return results.reduce<LintSummary>(
    (summary, result) => ({
      errorCount: summary.errorCount + result.errorCount,
      warningCount: summary.warningCount + result.warningCount,
      fixableErrorCount: summary.fixableErrorCount + result.fixableErrorCount,
      fixableWarningCount:
        summary.fixableWarningCount + result.fixableWarningCount,
      summaryColor:
        result.errorCount > 0 ? ('red' as const) : summary.summaryColor,
    }),
    {
      errorCount: 0,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      summaryColor: 'yellow',
    },
  );
}

// Format a single result file
function formatResultFile(result: ESLint.LintResult): string {
  if (result.messages.length === 0) {
    return '';
  }

  const header = `${underline(result.filePath)}\n`;

  const tableData = result.messages.map(message => {
    const messageType =
      message.fatal || message.severity === 2
        ? red('error')
        : yellow('warning');

    return [
      '',
      message.line || 0,
      message.column || 0,
      messageType,
      message.message.replace(/([^ ])\.$/u, '$1'),
      dim(message.ruleId || ''),
    ];
  });

  const table = createTable(tableData, {
    align: ['', 'r', 'l'],
    stringLength: (str: string) => stripAnsi(str).length,
  });

  const formattedTable = table
    .split('\n')
    .map(line =>
      line.replace(/(\d+)\s+(\d+)/u, (m, p1, p2) => dim(`${p1}:${p2}`)),
    )
    .join('\n');

  return `${header}${formattedTable}\n\n`;
}

// Format summary section
function formatSummary(summary: LintSummary): string {
  const {
    errorCount,
    warningCount,
    fixableErrorCount,
    fixableWarningCount,
    summaryColor,
  } = summary;
  const total = errorCount + warningCount;

  if (total === 0) {
    return '';
  }

  const colorFn = summaryColor === 'red' ? red : yellow;
  const problemText = [
    '\u2716 ',
    total,
    pluralize(' problem', total),
    ' (',
    errorCount,
    pluralize(' error', errorCount),
    ', ',
    warningCount,
    pluralize(' warning', warningCount),
    ')\n',
  ].join('');

  const problemOutput = bold(colorFn(problemText));

  if (fixableErrorCount > 0 || fixableWarningCount > 0) {
    const fixableText = [
      '  ',
      fixableErrorCount,
      pluralize(' error', fixableErrorCount),
      ' and ',
      fixableWarningCount,
      pluralize(' warning', fixableWarningCount),
      ' potentially fixable with the `--fix` option.\n',
    ].join('');

    return problemOutput + bold(colorFn(fixableText));
  }

  return problemOutput;
}

function stylishFormatter(results: ESLint.LintResult[]): string {
  const summary = calculateSummary(results);
  const filesOutput = results.map(formatResultFile).join('');
  const summaryOutput = formatSummary(summary);

  const total = summary.errorCount + summary.warningCount;
  return total > 0 ? reset(`\n${filesOutput}${summaryOutput}`) : '';
}

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
