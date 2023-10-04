import type { Audit } from '@quality-metrics/models';
import { distinct, slugify, toArray } from '@quality-metrics/utils';
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
  const name = ruleId.split('/').at(-1) ?? ruleId;
  const plugin =
    name === ruleId ? null : ruleId.slice(0, ruleId.lastIndexOf('/'));
  // TODO: add custom options hash to slug, copy to description
  return {
    slug: slugify(ruleId),
    title: meta.docs?.description ?? name,
    description: `ESLint rule **${name}**${
      plugin ? `, from _${plugin}_ plugin` : ''
    }.`,
    docsUrl: meta.docs?.url,
  };
}
