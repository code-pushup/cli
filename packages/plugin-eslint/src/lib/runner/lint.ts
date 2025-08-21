import type { ESLint, Linter } from 'eslint';
import { platform } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PERSIST_OUTPUT_DIR } from '@code-pushup/models';
import {
  distinct,
  executeProcess,
  filePathToCliArg,
  readJsonFile,
  toArray,
} from '@code-pushup/utils';
import type { ESLintTarget } from '../config.js';
import { setupESLint } from '../setup.js';
import type { LinterOutput, RuleOptionsPerFile } from './types.js';

export async function lint({
  eslintrc,
  patterns,
  outputDir,
}: ESLintTarget & { outputDir?: string }): Promise<LinterOutput> {
  const results = await executeLint({ eslintrc, patterns, outputDir });
  const eslint = await setupESLint(eslintrc);
  const ruleOptionsPerFile = await loadRuleOptionsPerFile(eslint, results);
  return { results, ruleOptionsPerFile };
}

// eslint-disable-next-line functional/no-let
let rotation = 0;

async function executeLint({
  eslintrc,
  patterns,
  outputDir: providedOutputDir,
}: ESLintTarget & { outputDir?: string }): Promise<ESLint.LintResult[]> {
  const outputDir =
    providedOutputDir ?? path.join(DEFAULT_PERSIST_OUTPUT_DIR, 'eslint');
  const filename = `eslint-report-${++rotation}`;

  // running as CLI because ESLint#lintFiles() runs out of memory
  await executeProcess({
    command: 'npx',
    args: [
      'eslint',
      ...(eslintrc ? [`--config=${filePathToCliArg(eslintrc)}`] : []),
      ...(typeof eslintrc === 'object' ? ['--no-eslintrc'] : []),
      '--no-error-on-unmatched-pattern',
      `--format=${path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        '../formatter/multiple-formats.js',
      )}`,
      ...toArray(patterns).map(pattern =>
        // globs need to be escaped on Unix
        platform() === 'win32' ? pattern : `'${pattern}'`,
      ),
    ],
    ignoreExitCode: true,
    cwd: process.cwd(),
    env: {
      ...process.env,
      ESLINT_FORMATTER_CONFIG: JSON.stringify({
        outputDir,
        filename,
        formats: ['json'], // Always write JSON to file for tracking
        terminal: 'stylish', // Always show stylish terminal output for DX
      }),
    },
  });

  return readJsonFile<ESLint.LintResult[]>(
    path.join(outputDir, `${filename}.json`),
  );
}

function loadRuleOptionsPerFile(
  eslint: ESLint,
  results: ESLint.LintResult[],
): Promise<RuleOptionsPerFile> {
  return results.reduce(async (acc, { filePath, messages }) => {
    const filesMap = await acc;
    const config = (await eslint.calculateConfigForFile(
      filePath,
    )) as Linter.Config;
    const ruleIds = distinct(
      messages
        .map(({ ruleId }) => ruleId)
        .filter((ruleId): ruleId is string => ruleId != null),
    );
    const rulesMap = Object.fromEntries(
      ruleIds.map(ruleId => [
        ruleId,
        toArray(config.rules?.[ruleId] ?? []).slice(1),
      ]),
    );
    return {
      ...filesMap,
      [filePath]: {
        ...filesMap[filePath],
        ...rulesMap,
      },
    };
  }, Promise.resolve<RuleOptionsPerFile>({}));
}
