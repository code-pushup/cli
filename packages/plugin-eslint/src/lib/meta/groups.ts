import type { Rule } from 'eslint';
import type { Group, GroupRef } from '@code-pushup/models';
import { objectToKeys, slugify } from '@code-pushup/utils';
import { ruleToSlug } from './hash.js';
import { type RuleData, parseRuleId } from './parse.js';

type RuleType = NonNullable<Rule.RuleMetaData['type']>;

// docs on meta.type: https://eslint.org/docs/latest/extend/custom-rules#rule-structure
const typeGroups: Record<RuleType, Omit<Group, 'refs'>> = {
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

export function groupsFromRuleTypes(rules: RuleData[]): Group[] {
  const allTypes = objectToKeys(typeGroups);

  const auditSlugsMap = rules.reduce<Partial<Record<RuleType, string[]>>>(
    (acc, rule) =>
      rule.meta.type == null
        ? acc
        : {
            ...acc,
            [rule.meta.type]: [
              ...(acc[rule.meta.type] ?? []),
              ruleToSlug(rule),
            ],
          },
    {},
  );

  return allTypes
    .map(type => ({
      ...typeGroups[type],
      refs:
        auditSlugsMap[type]?.map((slug): GroupRef => ({ slug, weight: 1 })) ??
        [],
    }))
    .filter(group => group.refs.length);
}

export function groupsFromRuleCategories(rules: RuleData[]): Group[] {
  const categoriesMap = rules.reduce<Record<string, Record<string, string[]>>>(
    (acc, rule) => {
      // meta.docs.category still used by some popular plugins (e.g. import, react, functional)
      const category = rule.meta.docs?.category;
      if (!category) {
        return acc;
      }
      const { plugin = '' } = parseRuleId(rule.id);
      return {
        ...acc,
        [plugin]: {
          ...acc[plugin],
          [category]: [...(acc[plugin]?.[category] ?? []), ruleToSlug(rule)],
        },
      };
    },
    {},
  );

  const groups = Object.entries(categoriesMap).flatMap(([plugin, categories]) =>
    Object.entries(categories).map(
      ([category, slugs]): Group => ({
        slug: `${slugify(plugin)}-${slugify(category)}`,
        title: `${category} (${plugin})`,
        refs: slugs.map(slug => ({ slug, weight: 1 })),
      }),
    ),
  );

  return groups.toSorted((a, b) => a.slug.localeCompare(b.slug));
}
