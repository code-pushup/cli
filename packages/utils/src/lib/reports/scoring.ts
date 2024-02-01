import {
  AuditReport,
  CategoryConfig,
  CategoryRef,
  Group,
  GroupRef,
  PluginReport,
  Report,
} from '@code-pushup/models';
import { deepClone } from '../transform';

export type EnrichedAuditReport = AuditReport & { plugin: string };
export type WeighedAuditReport = EnrichedAuditReport & { weight: number };
export type EnrichedScoredGroupWithAudits = EnrichedScoredGroup & {
  audits: AuditReport[];
};
export type ScoredCategoryConfig = CategoryConfig & { score: number };

export type EnrichedScoredGroup = Group & {
  plugin: string;
  score: number;
};

export type ScoredReport = Omit<Report, 'plugins' | 'categories'> & {
  plugins: (Omit<PluginReport, 'audits' | 'groups'> & {
    audits: EnrichedAuditReport[];
    groups: EnrichedScoredGroup[];
  })[];
  categories: ScoredCategoryConfig[];
};

// eslint-disable-next-line max-lines-per-function
export function scoreReport(report: Report): ScoredReport {
  const allScoredAuditsAndGroups = new Map<
    string,
    EnrichedAuditReport | EnrichedScoredGroup
  >();

  const scoredPlugins = report.plugins.map(plugin => {
    const { slug, audits, groups } = plugin;

    const updatedAudits = audits.map(audit => ({ ...audit, plugin: slug }));

    updatedAudits.forEach(audit => {
      allScoredAuditsAndGroups.set(`${slug}-${audit.slug}-audit`, audit);
    });

    function groupScoreFn(ref: GroupRef) {
      const score = allScoredAuditsAndGroups.get(
        `${slug}-${ref.slug}-audit`,
      )?.score;
      if (score == null) {
        throw new Error(
          `Group has invalid ref - audit with slug ${ref.slug} from plugin ${plugin.slug} not found`,
        );
      }
      return score;
    }

    const scoredGroups =
      groups?.map(group => ({
        ...group,
        score: calculateScore(group.refs, groupScoreFn),
        plugin: slug,
      })) ?? [];

    scoredGroups.forEach(group => {
      allScoredAuditsAndGroups.set(`${slug}-${group.slug}-group`, group);
    });

    return { ...plugin, audits: updatedAudits, groups: scoredGroups };
  });

  function catScoreFn(ref: CategoryRef) {
    const key = `${ref.plugin}-${ref.slug}-${ref.type}`;
    const item = allScoredAuditsAndGroups.get(key);
    if (!item) {
      throw new Error(
        `Category has invalid ref - ${ref.type} with slug ${key} not found in ${ref.plugin} plugin`,
      );
    }
    return item.score;
  }

  const scoredCategories = report.categories.map(category => ({
    ...category,
    score: calculateScore(category.refs, catScoreFn),
  }));
  return {
    ...deepClone(report),
    plugins: scoredPlugins,
    categories: scoredCategories,
  };
}

export function calculateScore<T extends { weight: number }>(
  refs: T[],
  scoreFn: (ref: T) => number,
): number {
  const validatedRefs = parseScoringParameters(refs, scoreFn);
  const { numerator, denominator } = validatedRefs.reduce(
    (acc, ref) => ({
      numerator: acc.numerator + ref.score * ref.weight,
      denominator: acc.denominator + ref.weight,
    }),
    { numerator: 0, denominator: 0 },
  );

  return numerator / denominator;
}

function parseScoringParameters<T extends { weight: number }>(
  refs: T[],
  scoreFn: (ref: T) => number,
): { weight: number; score: number }[] {
  if (refs.length === 0) {
    throw new Error('Reference array cannot be empty.');
  }

  if (refs.some(ref => ref.weight < 0)) {
    throw new Error('Weight cannot be negative.');
  }

  if (refs.every(ref => ref.weight === 0)) {
    throw new Error('All references cannot have zero weight.');
  }

  const scoredRefs = refs.map(ref => ({
    weight: ref.weight,
    score: scoreFn(ref),
  }));

  if (scoredRefs.some(ref => ref.score < 0 || ref.score > 1)) {
    throw new Error('All scores must be in range 0-1.');
  }

  return scoredRefs;
}
