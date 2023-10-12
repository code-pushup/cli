import { ESLint, type Linter } from 'eslint';
import { sep } from 'path';
import { distinct, toArray } from '@code-pushup/utils';
import type { LintResult, LinterOutput, RuleOptionsPerFile } from './types';

export async function lint(
  eslintrc: string,
  patterns: string[],
): Promise<LinterOutput> {
  const eslint = new ESLint({
    useEslintrc: false,
    baseConfig: { extends: eslintrc },
  });

  const lintResults = await eslint.lintFiles(patterns);
  const results = lintResults.map(
    (result): LintResult => ({
      ...result,
      relativeFilePath: result.filePath.replace(process.cwd() + sep, ''),
    }),
  );

  const ruleOptionsPerFile = await results.reduce(
    async (acc, { filePath, relativeFilePath, messages }) => {
      const filesMap = await acc;
      const config: Linter.Config = await eslint.calculateConfigForFile(
        filePath,
      );
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
        [relativeFilePath]: {
          ...filesMap[relativeFilePath],
          ...rulesMap,
        },
      };
    },
    Promise.resolve<RuleOptionsPerFile>({}),
  );

  return { results, ruleOptionsPerFile };
}
