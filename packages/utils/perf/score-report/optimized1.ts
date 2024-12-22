// Note: The plugins of the ScoredReport are not structured correctly, hence the ESLint disables.
import type { Report } from '@code-pushup/models';
import { GroupRefInvalidError } from '../../src/lib/reports/scoring.js';
import type {
  ScoredCategoryConfig,
  ScoredReport,
} from '../../src/lib/reports/types.js';

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
export function scoreReportOptimized1(report: Report): ScoredReport {
  const allScoredAuditsAndGroupsMap = new Map();

  report.plugins.forEach(plugin => {
    const { groups, audits, slug } = plugin;
    audits.forEach(audit =>
      allScoredAuditsAndGroupsMap.set(`${slug}-${audit.slug}-audit`, {
        ...audit,
        plugin: slug,
      }),
    );

    groups?.forEach(group => {
      allScoredAuditsAndGroupsMap.set(`${slug}-${group.slug}-group`, {
        ...group,
        score: calculateScore(group.refs, ref => {
          const score = allScoredAuditsAndGroupsMap.get(
            `${slug}-${ref.slug}-audit`,
          )?.score;
          if (score == null) {
            throw new GroupRefInvalidError(ref.slug, slug);
          }
          return score;
        }),
        plugin: slug,
      });
    });
  });

  const scoredCategoriesMap = report.categories.reduce(
    (categoryMap, category) => {
      categoryMap.set(category.slug, {
        ...category,
        score: calculateScore(category.refs, ref => {
          const audit = allScoredAuditsAndGroupsMap.get(
            `${ref.plugin}-${ref.slug}-${ref.type}`,
          );
          if (!audit) {
            throw new Error(
              `Category has invalid ref - audit with slug ${ref.plugin}-${ref.slug}-${ref.type} not found in ${ref.plugin} plugin`,
            );
          }
          return audit.score;
        }),
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
