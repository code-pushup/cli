import {
  AuditReport,
  CategoryConfig,
  CategoryRef,
  Group,
  GroupRef,
  PluginReport,
  Report,
} from '@code-pushup/models';
import { deepClone } from './transform';

export type EnrichedAuditReport = AuditReport & { plugin: string };
export type WeighedAuditReport = EnrichedAuditReport & { weight: number };
export type EnrichedScoredGroupWithAudits = EnrichedScoredGroup & {
  audits: AuditReport[];
};
type ScoredCategoryConfig = CategoryConfig & { score: number };

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

export function calculateScore<T extends { weight: number }>(
  refs: T[],
  scoreFn: (ref: T) => number,
): number {
  const { numerator, denominator } = refs.reduce(
    (acc, ref) => {
      const score = scoreFn(ref);
      return {
        numerator: acc.numerator + score * ref.weight,
        denominator: acc.denominator + ref.weight,
      };
    },
    { numerator: 0, denominator: 0 },
  );
  // No division by 0, otherwise we produce NaN
  // This can be caused by:
  // - empty category refs
  // - categories with refs only containing weight of `0`
  // both should get caught when validating the model
  if (!numerator && !denominator) {
    throw new Error(
      '0 division for score. This can be caused by refs only weighted with 0 or empty refs',
    );
  }
  return numerator / denominator;
}

export function scoreReport(report: Report): ScoredReport {
  const scoredReport = deepClone(report) as ScoredReport;
  const allScoredAuditsAndGroups = new Map();

  scoredReport.plugins?.forEach(plugin => {
    const { audits } = plugin;
    const groups = plugin.groups || [];

    audits.forEach(audit => {
      const key = `${plugin.slug}-${audit.slug}-audit`;
      audit.plugin = plugin.slug;
      allScoredAuditsAndGroups.set(key, audit);
    });

    function groupScoreFn(ref: GroupRef) {
      const score = allScoredAuditsAndGroups.get(
        `${plugin.slug}-${ref.slug}-audit`,
      )?.score;
      if (score == null) {
        throw new Error(
          `Group has invalid ref - audit with slug ${plugin.slug}-${ref.slug}-audit not found`,
        );
      }
      return score;
    }

    groups.forEach(group => {
      const key = `${plugin.slug}-${group.slug}-group`;
      group.score = calculateScore(group.refs, groupScoreFn);
      group.plugin = plugin.slug;
      allScoredAuditsAndGroups.set(key, group);
    });
    plugin.groups = groups;
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

  const scoredCategoriesMap = new Map();
  // eslint-disable-next-line functional/no-loop-statements
  for (const category of scoredReport.categories) {
    category.score = calculateScore(category.refs, catScoreFn);
    scoredCategoriesMap.set(category.slug, category);
  }

  scoredReport.categories = Array.from(scoredCategoriesMap.values());

  return scoredReport;
}
