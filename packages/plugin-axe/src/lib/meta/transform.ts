import axe from 'axe-core';
import type { Audit, Group } from '@code-pushup/models';
import { capitalize } from '@code-pushup/utils';
import type { AxePreset } from '../constants.js';

const WCAG_LEVEL_A_TAGS = ['wcag2a', 'wcag21a'];
const WCAG_LEVEL_AA_TAGS_21 = ['wcag2aa', 'wcag21aa'];
const WCAG_LEVEL_AA_TAGS_22 = ['wcag2aa', 'wcag21aa', 'wcag22aa'];

const CATEGORY_TITLES: Record<string, string> = {
  'cat.aria': 'ARIA',
  'cat.color': 'Color & Contrast',
  'cat.forms': 'Forms',
  'cat.keyboard': 'Keyboard',
  'cat.language': 'Language',
  'cat.name-role-value': 'Names & Labels',
  'cat.parsing': 'Parsing',
  'cat.semantics': 'Semantics',
  'cat.sensory-and-visual-cues': 'Visual Cues',
  'cat.structure': 'Structure',
  'cat.tables': 'Tables',
  'cat.text-alternatives': 'Text Alternatives',
  'cat.time-and-media': 'Media',
};

export function loadAxeRules(preset: AxePreset): axe.RuleMetadata[] {
  const tags = getPresetTags(preset);
  return tags.length === 0 ? axe.getRules() : axe.getRules(tags);
}

export function transformRulesToAudits(rules: axe.RuleMetadata[]): Audit[] {
  return rules.map(rule => ({
    slug: rule.ruleId,
    title: rule.help,
    description: rule.description,
    docsUrl: rule.helpUrl,
  }));
}

export function transformRulesToGroups(
  rules: axe.RuleMetadata[],
  preset: AxePreset,
): Group[] {
  const groups = (() => {
    switch (preset) {
      case 'wcag21aa':
        return createWcagGroups(rules, '2.1');
      case 'wcag22aa':
        return createWcagGroups(rules, '2.2');
      // eslint-disable-next-line sonarjs/no-duplicate-string
      case 'best-practice':
        return createCategoryGroups(rules);
      case 'all':
        return [
          ...createWcagGroups(rules, '2.2'),
          ...createCategoryGroups(rules),
        ];
    }
  })();

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
      return [...WCAG_LEVEL_A_TAGS, ...WCAG_LEVEL_AA_TAGS_21];
    case 'wcag22aa':
      return [...WCAG_LEVEL_A_TAGS, ...WCAG_LEVEL_AA_TAGS_22];
    case 'best-practice':
      return ['best-practice'];
    case 'all':
      return [];
  }
}

function createGroup(
  slug: string,
  title: string,
  rules: axe.RuleMetadata[],
): Group {
  return {
    slug,
    title,
    refs: rules.map(({ ruleId }) => ({ slug: ruleId, weight: 1 })),
  };
}

function createWcagGroups(
  rules: axe.RuleMetadata[],
  version: '2.1' | '2.2',
): Group[] {
  const aTags = WCAG_LEVEL_A_TAGS;
  const aaTags =
    version === '2.1' ? WCAG_LEVEL_AA_TAGS_21 : WCAG_LEVEL_AA_TAGS_22;

  const levelARules = rules.filter(({ tags }) =>
    tags.some(tag => aTags.includes(tag)),
  );

  const levelAARules = rules.filter(({ tags }) =>
    tags.some(tag => aaTags.includes(tag)),
  );

  const versionSlug = version.replace('.', '');

  return [
    createGroup(
      `wcag${versionSlug}-level-a`,
      `WCAG ${version} Level A`,
      levelARules,
    ),
    createGroup(
      `wcag${versionSlug}-level-aa`,
      `WCAG ${version} Level AA`,
      levelAARules,
    ),
  ];
}

function createCategoryGroups(rules: axe.RuleMetadata[]): Group[] {
  const categoryTags = new Set(
    rules.flatMap(({ tags }) => tags.filter(tag => tag.startsWith('cat.'))),
  );

  return [...categoryTags].map(tag => {
    const slug = tag.replace('cat.', '');
    const title = formatCategoryTitle(tag, slug);
    const categoryRules = rules.filter(({ tags }) => tags.includes(tag));

    return createGroup(slug, title, categoryRules);
  });
}

function formatCategoryTitle(tag: string, slug: string): string {
  if (CATEGORY_TITLES[tag]) {
    return CATEGORY_TITLES[tag];
  }
  return slug.split('-').map(capitalize).join(' ');
}
