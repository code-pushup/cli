import axe from 'axe-core';
import type { Audit, Group } from '@code-pushup/models';
import { objectToEntries, wrapTags } from '@code-pushup/utils';
import type { AxePreset } from '../config.js';
import {
  type AxeGroupSlug,
  CATEGORY_GROUPS,
  getWcagPresetTags,
} from '../groups.js';

/** Loads Axe rules filtered by the specified preset. */
export function loadAxeRules(preset: AxePreset): axe.RuleMetadata[] {
  const tags = getPresetTags(preset);
  return tags.length === 0 ? axe.getRules() : axe.getRules(tags);
}

/** Transforms Axe rule metadata into Code PushUp audit definitions. */
export function transformRulesToAudits(rules: axe.RuleMetadata[]): Audit[] {
  return rules.map(rule => ({
    slug: rule.ruleId,
    title: wrapTags(rule.help),
    description: wrapTags(rule.description),
    docsUrl: rule.helpUrl,
  }));
}

/** Transforms Axe rules into Code PushUp groups based on accessibility categories. */
export function transformRulesToGroups(rules: axe.RuleMetadata[]): Group[] {
  const groups = createCategoryGroups(rules);
  return groups.filter(({ refs }) => refs.length > 0);
}

/**
 * Maps preset to corresponding axe-core tags.
 *
 * WCAG tags are non-cumulative - each rule has exactly one WCAG version tag.
 * To include all rules up to a version/level, multiple tags must be combined.
 */
function getPresetTags(preset: AxePreset): string[] {
  switch (preset) {
    case 'wcag21aa':
      return getWcagPresetTags('wcag21aa');
    case 'wcag22aa':
      return getWcagPresetTags('wcag22aa');
    case 'best-practice':
      return ['best-practice'];
    case 'all':
      return [];
  }
}

function createGroup(
  slug: AxeGroupSlug,
  title: string,
  rules: axe.RuleMetadata[],
): Group {
  return {
    slug,
    title,
    refs: rules.map(({ ruleId }) => ({ slug: ruleId, weight: 1 })),
  };
}

function createCategoryGroups(rules: axe.RuleMetadata[]): Group[] {
  return objectToEntries(CATEGORY_GROUPS).map(([slug, title]) => {
    const tag = `cat.${slug}`;
    const categoryRules = rules.filter(({ tags }) => tags.includes(tag));

    return createGroup(slug, title, categoryRules);
  });
}
