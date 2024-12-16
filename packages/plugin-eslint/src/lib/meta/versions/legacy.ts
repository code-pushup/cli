import type { ESLint, Linter } from 'eslint';
import { distinct, exists, toArray, ui } from '@code-pushup/utils';
import type { ESLintTarget } from '../../config.js';
import { setupESLint } from '../../setup.js';
import { type RuleData, isRuleOff, optionsFromRuleEntry } from '../parse.js';

export async function loadRulesForLegacyConfig({
  eslintrc,
  patterns,
}: ESLintTarget): Promise<RuleData[]> {
  const eslint = await setupESLint(eslintrc);

  const configs = await toArray(patterns).reduce(
    async (acc, pattern) => [
      ...(await acc),
      (await eslint.calculateConfigForFile(pattern)) as Linter.LegacyConfig,
    ],
    Promise.resolve<Linter.LegacyConfig[]>([]),
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
    .map(([id, entry]): RuleData | null => {
      if (entry == null || isRuleOff(entry)) {
        return null;
      }
      const ruleMeta = rulesMeta[id];
      if (!ruleMeta) {
        ui().logger.warning(`Metadata not found for ESLint rule ${id}`);
        return null;
      }
      // ignoring meta.defaultOptions to match legacy config handling in calculateConfigForFile
      const { defaultOptions: _, ...meta } = ruleMeta;
      const options = optionsFromRuleEntry(entry);
      return { id, meta, options };
    })
    .filter(exists);
}
