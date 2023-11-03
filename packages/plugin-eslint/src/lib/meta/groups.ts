import type { Rule } from 'eslint';
import type { AuditGroup, AuditGroupRef } from '@code-pushup/models';
import { objectToKeys } from '@code-pushup/utils';
import { ruleIdToSlug } from './hash';
import type { RuleData } from './rules';

type RuleType = NonNullable<Rule.RuleMetaData['type']>;

// docs on meta.type: https://eslint.org/docs/latest/extend/custom-rules#rule-structure
const typeGroups: Record<RuleType, Omit<AuditGroup, 'refs'>> = {
  problem: {
    slug: 'problems',
    title: 'Problems',
    description:
      'Code that either will cause an error or may cause confusing behavior. Developers should consider this a high priority to resolve.',
  },
  suggestion: {
    slug: 'suggestions',
    title: 'Suggestions',
    description:
      "Something that could be done in a better way but no errors will occur if the code isn't changed.",
  },
  layout: {
    slug: 'formatting',
    title: 'Formatting',
    description:
      'Primarily about whitespace, semicolons, commas, and parentheses, all the parts of the program that determine how the code looks rather than how it executes.',
  },
};

export function groupsFromRuleTypes(rules: RuleData[]): AuditGroup[] {
  const allTypes = objectToKeys(typeGroups);

  const auditSlugsMap = rules.reduce<Partial<Record<RuleType, string[]>>>(
    (acc, { meta: { type }, ruleId, options }) =>
      type == null
        ? acc
        : {
            ...acc,
            [type]: [...(acc[type] ?? []), ruleIdToSlug(ruleId, options)],
          },
    {},
  );

  return allTypes.map(type => ({
    ...typeGroups[type],
    refs:
      auditSlugsMap[type]?.map(
        (slug): AuditGroupRef => ({ slug, weight: 1 }),
      ) ?? [],
  }));
}
