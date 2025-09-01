// Import ansis for colors (similar to chalk)
import { bold, dim, red, reset, underline, yellow } from 'ansis';
import type { ESLint } from 'eslint';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { FormatterConfig } from './types.js';

// Helper function to pluralize words
function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

// Simple function to strip ANSI codes for length calculation
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

// Simple table formatting function
function createTable(
  data: (string | number)[][],
  options: { align?: string[]; stringLength?: (str: string) => number } = {},
): string {
  const { align = [], stringLength = s => s.length } = options;

  if (data.length === 0) return '';

  // Calculate column widths
  const colWidths: number[] = [];
  data.forEach(row => {
    row.forEach((cell, colIndex) => {
      const cellStr = String(cell);
      const width = stringLength(cellStr);
      colWidths[colIndex] = Math.max(colWidths[colIndex] || 0, width);
    });
  });

  // Format rows
  return data
    .map(row => {
      return row
        .map((cell, colIndex) => {
          const cellStr = String(cell);
          const width = colWidths[colIndex] || 0;
          const padding = width - stringLength(cellStr);

          if (align[colIndex] === 'r') {
            return ' '.repeat(padding) + cellStr;
          }
          return cellStr + ' '.repeat(padding);
        })
        .join('  ');
    })
    .join('\n');
}

// Inline stylish formatter implementation using ansis
function stylishFormatter(results: ESLint.LintResult[]): string {
  let output = '\n';
  let errorCount = 0;
  let warningCount = 0;
  let fixableErrorCount = 0;
  let fixableWarningCount = 0;
  let summaryColor = 'yellow' as 'yellow' | 'red';

  results.forEach(result => {
    const messages = result.messages;

    if (messages.length === 0) {
      return;
    }

    errorCount += result.errorCount;
    warningCount += result.warningCount;
    fixableErrorCount += result.fixableErrorCount;
    fixableWarningCount += result.fixableWarningCount;

    output += `${underline(result.filePath)}\n`;

    const tableData = messages.map(message => {
      let messageType: string;

      if (message.fatal || message.severity === 2) {
        messageType = red('error');
        summaryColor = 'red';
      } else {
        messageType = yellow('warning');
      }

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

    // Format line:column numbers with dim styling
    const formattedTable = table
      .split('\n')
      .map(line =>
        line.replace(/(\d+)\s+(\d+)/u, (m, p1, p2) => dim(`${p1}:${p2}`)),
      )
      .join('\n');

    output += `${formattedTable}\n\n`;
  });

  const total = errorCount + warningCount;

  if (total > 0) {
    if (summaryColor === 'red') {
      output += bold(
        red(
          [
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
          ].join(''),
        ),
      );

      if (fixableErrorCount > 0 || fixableWarningCount > 0) {
        output += bold(
          red(
            [
              '  ',
              fixableErrorCount,
              pluralize(' error', fixableErrorCount),
              ' and ',
              fixableWarningCount,
              pluralize(' warning', fixableWarningCount),
              ' potentially fixable with the `--fix` option.\n',
            ].join(''),
          ),
        );
      }
    } else {
      output += bold(
        yellow(
          [
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
          ].join(''),
        ),
      );

      if (fixableErrorCount > 0 || fixableWarningCount > 0) {
        output += bold(
          yellow(
            [
              '  ',
              fixableErrorCount,
              pluralize(' error', fixableErrorCount),
              ' and ',
              fixableWarningCount,
              pluralize(' warning', fixableWarningCount),
              ' potentially fixable with the `--fix` option.\n',
            ].join(''),
          ),
        );
      }
    }
  }

  // Reset output color to prevent changes at top level
  return total > 0 ? reset(output) : '';
}

export function stringifyError(error: unknown): string {
  // TODO: special handling for ZodError instances
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
  const projectsDir = env['ESLINT_FORMATTER_PROJECTS_DIR'];

  if (
    (!configString || configString.trim() === '') &&
    (!projectsDir || projectsDir.trim() === '')
  ) {
    return null;
  }

  try {
    return {
      ...(JSON.parse(configString ?? '{}') as FormatterConfig),
      projectsDir: env['ESLINT_FORMATTER_PROJECTS_DIR'],
    };
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
  options: Omit<PersistConfig, 'format'>,
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
