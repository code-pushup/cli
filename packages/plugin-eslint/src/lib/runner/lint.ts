import type { Linter } from 'eslint';
import { distinct, toArray } from '@code-pushup/utils';
import { ESLintPluginConfig } from '../config';
import { setupESLint } from '../setup';
import type { LinterOutput, RuleOptionsPerFile } from './types';

export async function lint({
  eslintrc,
  patterns,
}: ESLintPluginConfig): Promise<LinterOutput> {
  const eslint = setupESLint(eslintrc);

  const results = await eslint.lintFiles(patterns);

  const ruleOptionsPerFile = await results.reduce(
    async (acc, { filePath, messages }) => {
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
    },
    Promise.resolve<RuleOptionsPerFile>({}),
  );

  return { results, ruleOptionsPerFile };
}
