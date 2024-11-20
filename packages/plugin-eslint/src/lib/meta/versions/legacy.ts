import type { ESLint, Linter } from 'eslint';
import { distinct, exists, toArray, ui } from '@code-pushup/utils';
import type { ESLintTarget } from '../../config';
import { setupESLint } from '../../setup';
import { type RuleData, isRuleOff } from '../parse';

export async function loadRulesForLegacyConfig({
  eslintrc,
  patterns,
}: ESLintTarget): Promise<RuleData[]> {
  const eslint = setupESLint(eslintrc);

  const configs = await toArray(patterns).reduce(
    async (acc, pattern) => [
      ...(await acc),
      (await eslint.calculateConfigForFile(pattern)) as Linter.Config,
    ],
    Promise.resolve<Linter.Config[]>([]),
  );

  const rulesIds = distinct(
    configs.flatMap(config => Object.keys(config.rules ?? {})),
  );
  const rulesMeta = eslint.getRulesMetaForResults([
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {
      messages: rulesIds.map(ruleId => ({ ruleId })),
      suppressedMessages: [] as Linter.SuppressedLintMessage[],
    } as ESLint.LintResult,
  ]);

  return configs
    .flatMap(config => Object.entries(config.rules ?? {}))
    .map(([ruleId, ruleEntry]): RuleData | null => {
      if (ruleEntry == null || isRuleOff(ruleEntry)) {
        return null;
      }
      const meta = rulesMeta[ruleId];
      if (!meta) {
        ui().logger.warning(`Metadata not found for ESLint rule ${ruleId}`);
        return null;
      }
      const options = toArray(ruleEntry).slice(1);
      return {
        ruleId,
        meta,
        options,
      };
    })
    .filter(exists);
}
