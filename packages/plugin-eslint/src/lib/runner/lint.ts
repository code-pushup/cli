import type { ESLint, Linter } from 'eslint';
import { platform } from 'node:os';
import path from 'node:path';
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

type LintResult = ESLint.LintResult;

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
let lintFilesRotation = 0;

async function executeLint({
  eslintrc,
  patterns,
  outputDir,
}: ESLintTarget & { outputDir?: string }): Promise<ESLint.LintResult[]> {
  const reportOutputPath = path.join(
    outputDir ?? DEFAULT_PERSIST_OUTPUT_DIR,
    `eslint-report.${++lintFilesRotation}.json`,
  );
  // running as CLI because ESLint#lintFiles() runs out of memory
  await executeProcess({
    command: 'npx',
    args: [
      'eslint',
      ...(eslintrc ? [`--config=${filePathToCliArg(eslintrc)}`] : []),
      ...(typeof eslintrc === 'object' ? ['--no-eslintrc'] : []),
      '--no-error-on-unmatched-pattern',
      '--format=../../../tools/eslint-programmatic-formatter.cjs',
      ...toArray(patterns).map(pattern =>
        // globs need to be escaped on Unix
        platform() === 'win32' ? pattern : `'${pattern}'`,
      ),
    ],
    ignoreExitCode: true,
    cwd: process.cwd(),
  });

  return readJsonFile<LintResult[]>(reportOutputPath);
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
