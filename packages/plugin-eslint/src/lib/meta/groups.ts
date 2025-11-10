import type { Rule } from 'eslint';
import type { Group, GroupRef } from '@code-pushup/models';
import { logger, objectToKeys, slugify } from '@code-pushup/utils';
import type { CustomGroup } from '../config.js';
import { ruleToSlug } from './hash.js';
import { type RuleData, parseRuleId } from './parse.js';
import { expandWildcardRules } from './rules.js';

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

export function groupsFromCustomConfig(
  rules: RuleData[],
  groups: CustomGroup[],
): Group[] {
  const rulesMap = createRulesMap(rules);

  return groups.map(group => {
    const groupRules = Array.isArray(group.rules)
      ? Object.fromEntries(group.rules.map(rule => [rule, 1]))
      : group.rules;

    const { refs, invalidRules } = resolveGroupRefs(groupRules, rulesMap);

    if (invalidRules.length > 0 && Object.entries(groupRules).length > 0) {
      if (refs.length === 0) {
        throw new Error(
          `Invalid rule configuration in group ${group.slug}. All rules are invalid.`,
        );
      }
      logger.warn(
        `Some rules in group ${group.slug} are invalid: ${invalidRules.join(', ')}`,
      );
    }

    return {
      slug: group.slug,
      title: group.title,
      refs,
    };
  });
}

export function createRulesMap(rules: RuleData[]): Record<string, RuleData[]> {
  return rules.reduce<Record<string, RuleData[]>>(
    (acc, rule) => ({
      ...acc,
      [rule.id]: [...(acc[rule.id] || []), rule],
    }),
    {},
  );
}

export function resolveGroupRefs(
  groupRules: Record<string, number>,
  rulesMap: Record<string, RuleData[]>,
): { refs: Group['refs']; invalidRules: string[] } {
  return Object.entries(groupRules).reduce<{
    refs: Group['refs'];
    invalidRules: string[];
  }>(
    (acc, [rule, weight]) => {
      const matchedRuleIds = rule.endsWith('*')
        ? expandWildcardRules(rule, Object.keys(rulesMap))
        : [rule];

      const matchedRefs = matchedRuleIds.flatMap(ruleId => {
        const matchingRules = rulesMap[ruleId] || [];
        const weightPerRule = weight / matchingRules.length;

        return matchingRules.map(ruleData => ({
          slug: ruleToSlug(ruleData),
          weight: weightPerRule,
        }));
      });

      return {
        refs: [...acc.refs, ...matchedRefs],
        invalidRules:
          matchedRefs.length > 0
            ? acc.invalidRules
            : [...acc.invalidRules, rule],
      };
    },
    { refs: [], invalidRules: [] },
  );
}
