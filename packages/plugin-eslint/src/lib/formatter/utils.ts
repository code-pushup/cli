import { ESLint } from 'eslint';
import { writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { EslintFormat, FormatterConfig } from './types.js';

const eslint = new ESLint();

export function getExtensionForFormat(format: EslintFormat): string {
  const extensionMap: Record<EslintFormat, string> = {
    json: '.json',
    'json-with-metadata': 'json-with-metadata.json',
    html: 'html.html',
    xml: 'xml.xml',
    checkstyle: 'checkstyle.xml',
    junit: 'junit.xml',
    tap: '.tap',
    unix: 'unix.txt',
    stylish: 'stylish.txt',
    compact: 'compact.txt',
    codeframe: 'codeframe.txt',
    table: 'table.txt',
  };

  return extensionMap[format] || '.txt';
}

export async function formatContent(
  results: ESLint.LintResult[],
  format: EslintFormat,
): Promise<string> {
  const formatter = await eslint.loadFormatter(format);
  return formatter.format(results);
}

export function findConfigFromEnv(
  env: NodeJS.ProcessEnv,
): FormatterConfig | null {
  const configString = env['ESLINT_FORMATTER_CONFIG'];

  if (!configString || configString.trim() === '') {
    return null;
  }

  try {
    const parsed = JSON.parse(configString);

    // Validate that parsed result is an object
    if (typeof parsed !== 'object' || parsed == null || Array.isArray(parsed)) {
      console.error('ESLINT_FORMATTER_CONFIG must be a valid JSON object');
      return null;
    }

    return parsed as FormatterConfig;
  } catch (error_) {
    console.error(
      'Error parsing ESLINT_FORMATTER_CONFIG environment variable:',
      (error_ as Error).message,
    );
    return null;
  }
}

export async function handleTerminalOutput(
  format: EslintFormat | undefined,
  results: ESLint.LintResult[],
): Promise<void> {
  if (!format) {
    return;
  }
  const content = await formatContent(results, format);
  // eslint-disable-next-line no-console
  console.log(content);
}

export type PersistConfig = {
  outputDir: string;
  filename: string;
  format: EslintFormat;
  verbose?: boolean;
};

export async function persistEslintReport(
  content: string,
  options: PersistConfig,
): Promise<boolean> {
  const { outputDir, filename, format, verbose = false } = options;
  try {
    await mkdir(path.dirname(outputDir), { recursive: true });
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

export async function persistEslintReports(
  formats: EslintFormat[],
  results: ESLint.LintResult[],
  options: { outputDir: string; filename: string; verbose: boolean },
): Promise<boolean> {
  const { outputDir, filename, verbose } = options;

  // eslint-disable-next-line functional/no-loop-statements
  for (const format of formats) {
    const content = await formatContent(results, format);

    const success = await persistEslintReport(content, {
      outputDir,
      filename,
      format,
      verbose,
    });

    if (!success) {
      return false;
    }
  }
  return true;
}
