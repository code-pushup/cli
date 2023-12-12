import { AuditGroupRef, CategoryRef, Report } from '@code-pushup/models';
import { ScoredReport } from '../../src';

export function calculateScore<T extends { weight: number }>(
  refs: T[],
  scoreFn: (ref: T) => number,
) {
  const numerator = refs.reduce(
    (sum, ref) => sum + scoreFn(ref) * ref.weight,
    0,
  );
  const denominator = refs.reduce((sum, ref) => sum + ref.weight, 0);
  return numerator / denominator;
}

export function scoreReportOptimized2(report: Report): ScoredReport {
  const allScoredAuditsAndGroupsMap = new Map();

  report.plugins.forEach(plugin => {
    const { groups, audits } = plugin;
    audits.forEach(audit =>
      allScoredAuditsAndGroupsMap.set(`${plugin.slug}-${audit.slug}-audit`, {
        ...audit,
        plugin: plugin.slug,
      }),
    );

    function groupScoreFn(ref: AuditGroupRef) {
      const score = allScoredAuditsAndGroupsMap.get(
        `${plugin.slug}-${ref.slug}-audit`,
      )?.score;
      if (score == null) {
        throw new Error(
          `Group has invalid ref - audit with slug ${plugin.slug}-${ref.slug}-audit not found`,
        );
      }
      return score;
    }
    groups?.forEach(group => {
      allScoredAuditsAndGroupsMap.set(`${plugin.slug}-${group.slug}-group`, {
        ...group,
        score: calculateScore(group.refs, groupScoreFn),
        plugin: plugin.slug,
      });
    });
  });

  function catScoreFn(ref: CategoryRef) {
    const audit = allScoredAuditsAndGroupsMap.get(
      `${ref.plugin}-${ref.slug}-${ref.type}`,
    );
    if (!audit) {
      throw new Error(
        `Category has invalid ref - audit with slug ${ref.plugin}-${ref.slug}-${ref.type} not found in ${ref.plugin} plugin`,
      );
    }
    return audit.score;
  }
  const scoredCategoriesMap = report.categories.reduce(
    (categoryMap, category) => {
      categoryMap.set(category.slug, {
        ...category,
        score: calculateScore(category.refs, catScoreFn),
      });
      return categoryMap;
    },
    new Map(),
  );

  return {
    ...report,
    categories: Array.from(scoredCategoriesMap.values()),
    plugins: Array.from(allScoredAuditsAndGroupsMap.values()),
  };
}
