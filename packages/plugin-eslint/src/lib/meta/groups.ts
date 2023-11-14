import type { Rule } from 'eslint';
import type { AuditGroup, AuditGroupRef } from '@code-pushup/models';
import { objectToKeys, slugify } from '@code-pushup/utils';
import { ruleIdToSlug } from './hash';
import { type RuleData, parseRuleId } from './rules';

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

export function groupsFromRuleCategories(rules: RuleData[]): AuditGroup[] {
  const categoriesMap = rules.reduce<Record<string, Record<string, string[]>>>(
    (acc, { meta: { docs }, ruleId, options }) => {
      // meta.docs.category still used by some popular plugins (e.g. import, react, functional)
      // eslint-disable-next-line deprecation/deprecation
      const category = docs?.category;
      if (!category) {
        return acc;
      }
      const { plugin = '' } = parseRuleId(ruleId);
      return {
        ...acc,
        [plugin]: {
          ...acc[plugin],
          [category]: [
            ...(acc[plugin]?.[category] ?? []),
            ruleIdToSlug(ruleId, options),
          ],
        },
      };
    },
    {},
  );

  return Object.entries(categoriesMap)
    .flatMap(([plugin, categories]) =>
      Object.entries(categories).map(
        ([category, slugs]): AuditGroup => ({
          slug: `${slugify(plugin)}-${slugify(category)}`,
          title: `${category} (${plugin})`,
          refs: slugs.map(slug => ({ slug, weight: 1 })),
        }),
      ),
    )
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
