import type { Linter } from 'eslint';
import { distinct, toArray, toUnixPath } from '@code-pushup/utils';
import { ESLintPluginConfig } from '../config';
import { setupESLint } from '../setup';
import type { LintResult, LinterOutput, RuleOptionsPerFile } from './types';

export async function lint({
  eslintrc,
  patterns,
}: ESLintPluginConfig): Promise<LinterOutput> {
  const eslint = setupESLint(eslintrc);

  const lintResults = await eslint.lintFiles(patterns);
  const results = lintResults.map(
    (result): LintResult => ({
      ...result,
      relativeFilePath: toUnixPath(result.filePath, { toRelative: true }),
    }),
  );

  const ruleOptionsPerFile = await results.reduce(
    async (acc, { filePath, relativeFilePath, messages }) => {
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
