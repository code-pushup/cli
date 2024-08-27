import type {
  AuditReport,
  CategoryRef,
  GroupRef,
  Report,
} from '@code-pushup/models';
import type { ScoredGroup, ScoredReport } from '../../src/lib/reports/types';

function groupRefToScore(audits: AuditReport[]) {
  return (ref: GroupRef) => {
    const score = audits.find(audit => audit.slug === ref.slug)?.score;
    if (score == null) {
      throw new Error(
        `Group has invalid ref - audit with slug ${ref.slug} not found`,
      );
    }
    return score;
  };
}

function categoryRefToScore(audits: AuditReport[], groups: ScoredGroup[]) {
  return (ref: CategoryRef) => {
    switch (ref.type) {
      case 'audit':
        const audit = audits.find(a => a.slug === ref.slug);
        if (!audit) {
          throw new Error(
            `Category has invalid ref - audit with slug ${ref.slug} not found in ${ref.plugin} plugin`,
          );
        }
        return audit.score;

      case 'group':
        const group = groups.find(g => g.slug === ref.slug);
        if (!group) {
          throw new Error(
            `Category has invalid ref - group with slug ${ref.slug} not found in ${ref.plugin} plugin`,
          );
        }
        return group.score;
    }
  };
}

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

export function scoreReportOptimized0(report: Report): ScoredReport {
  const scoredPlugins = report.plugins.map(plugin => {
    const { groups, audits, slug } = plugin;
    const preparedAudits = audits.map(audit => ({
      ...audit,
      plugin: slug,
    }));
    const preparedGroups =
      groups?.map(group => ({
        ...group,
        score: calculateScore(group.refs, groupRefToScore(preparedAudits)),
        plugin: slug,
      })) ?? [];

    return {
      ...plugin,
      audits: preparedAudits,
      groups: preparedGroups,
    };
  });

  const allScoredAudits = scoredPlugins.flatMap(({ audits }) => audits);
  const allScoredGroups = scoredPlugins.flatMap(({ groups }) => groups);

  const scoredCategories = report.categories.map(category => ({
    ...category,
    score: calculateScore(
      category.refs,
      categoryRefToScore(allScoredAudits, allScoredGroups),
    ),
  }));

  return {
    ...report,
    categories: scoredCategories,
    plugins: scoredPlugins,
  };
}
