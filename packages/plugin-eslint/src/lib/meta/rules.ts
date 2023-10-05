import { distinct, toArray } from '@quality-metrics/utils';
import type { ESLint, Linter, Rule } from 'eslint';
import { jsonHash } from './hash';

export type RuleData = {
  ruleId: string;
  meta: Rule.RuleMetaData;
  options: unknown[] | undefined;
};

export async function listRules(
  eslint: ESLint,
  patterns: string | string[],
): Promise<RuleData[]> {
  const configs = await toArray(patterns).reduce(
    async (acc, pattern) => [
      ...(await acc),
      await eslint.calculateConfigForFile(pattern),
    ],
    Promise.resolve<Linter.Config[]>([]),
  );

  const rulesIds = distinct(
    configs.flatMap(config => Object.keys(config.rules ?? {})),
  );
  const rulesMeta = eslint.getRulesMetaForResults([
    {
      messages: rulesIds.map(ruleId => ({ ruleId })),
      suppressedMessages: [] as Linter.SuppressedLintMessage[],
    } as ESLint.LintResult,
  ]);

  const rulesMap = configs
    .flatMap(config => Object.entries(config.rules ?? {}))
    .filter(([, ruleEntry]) => ruleEntry != null && !isRuleOff(ruleEntry))
    .reduce<Record<string, Record<string, RuleData>>>(
      (acc, [ruleId, ruleEntry]) => {
        const meta = rulesMeta[ruleId];
        if (!meta) {
          console.warn(`Metadata not found for ESLint rule ${ruleId}`);
          return acc;
        }
        const options = toArray(ruleEntry).slice(1);
        const optionsHash = jsonHash(options);
        const ruleData: RuleData = {
          ruleId,
          meta,
          options,
        };
        return {
          ...acc,
          [ruleId]: {
            ...acc[ruleId],
            [optionsHash]: ruleData,
          },
        };
      },
      {},
    );

  return Object.values(rulesMap).flatMap(Object.values);
}

function isRuleOff(entry: Linter.RuleEntry<unknown[]>): boolean {
  const level: Linter.RuleLevel = Array.isArray(entry) ? entry[0] : entry;

  switch (level) {
    case 0:
    case 'off':
      return true;
    case 1:
    case 2:
    case 'warn':
    case 'error':
      return false;
  }
}
