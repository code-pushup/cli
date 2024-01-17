import { CategoryRef, GroupRef, Report } from '@code-pushup/models';
import { ScoredReport } from '../../src';

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
  return numerator / denominator;
}

export function deepClone<T>(obj: T): T {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }

  const cloned: T = Array.isArray(obj) ? ([] as T) : ({} as T);
  // eslint-disable-next-line functional/no-loop-statements
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key as keyof T] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export function scoreReportOptimized3(report: Report): ScoredReport {
  const scoredReport = deepClone(report) as ScoredReport;
  const allScoredAuditsAndGroups = new Map();

  scoredReport.plugins?.forEach(plugin => {
    const { audits, slug } = plugin;
    const groups = plugin.groups || [];

    audits.forEach(audit => {
      const key = `${slug}-${audit.slug}-audit`;
      audit.plugin = slug;
      allScoredAuditsAndGroups.set(key, audit);
    });

    function groupScoreFn(ref: GroupRef) {
      const score = allScoredAuditsAndGroups.get(
        `${slug}-${ref.slug}-audit`,
      )?.score;
      if (score == null) {
        throw new Error(
          `Group has invalid ref - audit with slug ${slug}-${ref.slug}-audit not found`,
        );
      }
      return score;
    }

    groups.forEach(group => {
      const key = `${slug}-${group.slug}-group`;
      group.score = calculateScore(group.refs, groupScoreFn);
      group.plugin = slug;
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

  scoredReport.categories = [...scoredCategoriesMap.values()];

  return scoredReport;
}
