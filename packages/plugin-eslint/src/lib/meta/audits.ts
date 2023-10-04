import type { Audit } from '@quality-metrics/models';
import { distinct, toArray } from '@quality-metrics/utils';
import type { ESLint, Linter, Rule } from 'eslint';

export async function listAudits(
  eslint: ESLint,
  patterns: string | string[],
): Promise<Audit[]> {
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

  return Object.entries(rulesMeta).map(args => ruleToAudit(...args));
}

function ruleToAudit(ruleId: string, meta: Rule.RuleMetaData): Audit {
  return {
    slug: ruleId, // TODO: slugify
    title: meta.docs?.description ?? ruleId,
    docsUrl: meta.docs?.url,
  };
}
