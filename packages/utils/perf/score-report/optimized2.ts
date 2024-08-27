/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
// Note: The plugins of the ScoredReport are not structured correctly, hence the ESLint disables.
import type { CategoryRef, GroupRef, Report } from '@code-pushup/models';
import { GroupRefInvalidError } from '../../src/lib/reports/scoring';
import type {
  ScoredCategoryConfig,
  ScoredReport,
} from '../../src/lib/reports/types';

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

// eslint-disable-next-line max-lines-per-function
export function scoreReportOptimized2(report: Report): ScoredReport {
  const allScoredAuditsAndGroupsMap = new Map();

  report.plugins.forEach(plugin => {
    const { groups, audits, slug } = plugin;
    audits.forEach(audit =>
      allScoredAuditsAndGroupsMap.set(`${slug}-${audit.slug}-audit`, {
        ...audit,
        plugin: slug,
      }),
    );

    function groupScoreFn(ref: GroupRef) {
      const score = allScoredAuditsAndGroupsMap.get(
        `${slug}-${ref.slug}-audit`,
      )?.score;
      if (score == null) {
        throw new GroupRefInvalidError(ref.slug, slug);
      }
      return score;
    }
    groups?.forEach(group => {
      allScoredAuditsAndGroupsMap.set(`${slug}-${group.slug}-group`, {
        ...group,
        score: calculateScore(group.refs, groupScoreFn),
        plugin: slug,
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
    new Map<string, ScoredCategoryConfig>(),
  );

  return {
    ...report,
    categories: [...scoredCategoriesMap.values()],
    plugins: [...allScoredAuditsAndGroupsMap.values()],
  };
}
