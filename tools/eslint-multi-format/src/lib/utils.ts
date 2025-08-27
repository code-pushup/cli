import type { ESLint } from 'eslint';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { EslintFormat, FormatterConfig } from './types.js';

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
  } catch (error_) {
    console.error(
      'Error parsing ESLINT_FORMATTER_CONFIG environment variable:',
      (error_ as Error).message,
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

const LINE_COLUMN_PADDING = 3;
const SEVERITY_PADDING = 7;

function formatStylish(results: ESLint.LintResult[]): string {
  const resultsWithMessages = results.filter(
    result => result.messages.length > 0,
  );

  const { output, totalErrors, totalWarnings } = resultsWithMessages.reduce(
    (acc, result) => {
      const { filePath, messages } = result;
      const fileOutput = `\n${filePath}\n`;

      const { messageOutput, errors, warnings } = messages.reduce(
        (msgAcc, message) => {
          const {
            line = 0,
            column = 0,
            severity,
            message: text,
            ruleId,
          } = message;
          const severityText = severity === 2 ? 'error' : 'warning';

          const ruleIdText = ruleId ? `  ${ruleId}` : '';
          const formattedMessage = `  ${String(line).padStart(LINE_COLUMN_PADDING)}:${String(column).padStart(LINE_COLUMN_PADDING)}  ${severityText.padEnd(SEVERITY_PADDING)}  ${text}${ruleIdText}\n`;

          return {
            messageOutput: msgAcc.messageOutput + formattedMessage,
            errors: msgAcc.errors + (severity === 2 ? 1 : 0),
            warnings: msgAcc.warnings + (severity === 1 ? 1 : 0),
          };
        },
        { messageOutput: '', errors: 0, warnings: 0 },
      );

      return {
        output: acc.output + fileOutput + messageOutput,
        totalErrors: acc.totalErrors + errors,
        totalWarnings: acc.totalWarnings + warnings,
      };
    },
    { output: '', totalErrors: 0, totalWarnings: 0 },
  );

  const totalProblems = totalErrors + totalWarnings;
  const summary =
    totalProblems > 0
      ? `\n✖ ${totalProblems} problem${totalProblems === 1 ? '' : 's'} ` +
        `(${totalErrors} error${totalErrors === 1 ? '' : 's'}, ${totalWarnings} warning${totalWarnings === 1 ? '' : 's'})`
      : '';

  return output + summary;
}

export function formatContent(
  results: ESLint.LintResult[],
  format: EslintFormat,
): string {
  switch (format) {
    case 'json':
      return formatJson(results);
    case 'stylish':
      return formatStylish(results);
    default:
      return formatStylish(results);
  }
}

export function getTerminalOutput(
  format: EslintFormat | undefined,
  results: ESLint.LintResult[],
): string {
  if (!format) {
    return '';
  }
  return formatContent(results, format);
}

export function persistEslintReport(
  content: string,
  options: PersistConfig,
): boolean {
  const { outputDir, filename, format, verbose = false } = options;
  try {
    // eslint-disable-next-line n/no-sync
    mkdirSync(outputDir, { recursive: true });
    // eslint-disable-next-line n/no-sync
    writeFileSync(
      path.join(outputDir, `${filename}.${getExtensionForFormat(format)}`),
      content,
    );
    if (verbose) {
      // eslint-disable-next-line no-console
      console.log(`ESLint report (${format}) written to: ${outputDir}`);
    }
    return true;
  } catch (error_) {
    if (verbose) {
      console.error('There was a problem writing the output file:\n%s', error_);
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

  return formats.every(format => {
    const content = formatContent(results, format);

    return persistEslintReport(content, {
      outputDir,
      filename,
      format,
      verbose,
    });
  });
}
