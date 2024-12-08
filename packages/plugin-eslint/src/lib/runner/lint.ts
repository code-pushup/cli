import type { ESLint, Linter } from 'eslint';
import { platform } from 'node:os';
import {
  distinct,
  executeProcess,
  filePathToCliArg,
  toArray,
} from '@code-pushup/utils';
import type { ESLintTarget } from '../config.js';
import { setupESLint } from '../setup.js';
import type { LinterOutput, RuleOptionsPerFile } from './types.js';

export async function lint({
  eslintrc,
  patterns,
}: ESLintTarget): Promise<LinterOutput> {
  const results = await executeLint({ eslintrc, patterns });
  const eslint = await setupESLint(eslintrc);
  const ruleOptionsPerFile = await loadRuleOptionsPerFile(eslint, results);
  return { results, ruleOptionsPerFile };
}

async function executeLint({
  eslintrc,
  patterns,
}: ESLintTarget): Promise<ESLint.LintResult[]> {
  // running as CLI because ESLint#lintFiles() runs out of memory
  const { stdout } = await executeProcess({
    command: 'npx',
    args: [
      'eslint',
      ...(eslintrc ? [`--config=${filePathToCliArg(eslintrc)}`] : []),
      ...(typeof eslintrc === 'object' ? ['--no-eslintrc'] : []),
      '--no-error-on-unmatched-pattern',
      '--format=json',
      ...toArray(patterns).map(pattern =>
        // globs need to be escaped on Unix
        platform() === 'win32' ? pattern : `'${pattern}'`,
      ),
    ],
    ignoreExitCode: true,
    cwd: process.cwd(),
  });

  return JSON.parse(stdout) as ESLint.LintResult[];
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
