import type { ESLint, Linter } from 'eslint';
import { rm, writeFile } from 'node:fs/promises';
import { platform } from 'node:os';
import { join } from 'node:path';
import {
  distinct,
  executeProcess,
  filePathToCliArg,
  toArray,
} from '@code-pushup/utils';
import type { ESLintTarget } from '../config';
import { setupESLint } from '../setup';
import type { LinterOutput, RuleOptionsPerFile } from './types';

export async function lint({
  eslintrc,
  patterns,
}: ESLintTarget): Promise<LinterOutput> {
  const results = await executeLint({ eslintrc, patterns });
  const ruleOptionsPerFile = await loadRuleOptionsPerFile(eslintrc, results);
  return { results, ruleOptionsPerFile };
}

function executeLint({
  eslintrc,
  patterns,
}: ESLintTarget): Promise<ESLint.LintResult[]> {
  return withConfig(eslintrc, async configPath => {
    // running as CLI because ESLint#lintFiles() runs out of memory
    const { stdout } = await executeProcess({
      command: 'npx',
      args: [
        'eslint',
        ...(configPath ? [`--config=${filePathToCliArg(configPath)}`] : []),
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
  });
}

function loadRuleOptionsPerFile(
  eslintrc: ESLintTarget['eslintrc'],
  results: ESLint.LintResult[],
): Promise<RuleOptionsPerFile> {
  const eslint = setupESLint(eslintrc);

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

async function withConfig<T>(
  eslintrc: ESLintTarget['eslintrc'],
  fn: (configPath: string | undefined) => Promise<T>,
): Promise<T> {
  if (typeof eslintrc !== 'object') {
    return fn(eslintrc);
  }

  const configPath = generateTempConfigPath();
  await writeFile(configPath, JSON.stringify(eslintrc));

  try {
    return await fn(configPath);
  } finally {
    await rm(configPath);
  }
}

function generateTempConfigPath(): string {
  return join(
    process.cwd(),
    `.eslintrc.${Math.random().toString().slice(2)}.json`,
  );
}
