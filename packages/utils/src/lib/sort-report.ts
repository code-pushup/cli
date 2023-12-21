import { CategoryRef } from '@code-pushup/models';
import {
  compareIssues,
  getAuditByRef,
  getGroupWithAudits,
  sortAudits,
  sortCategoryAudits,
} from './report';
import {
  EnrichedScoredAuditGroupWithAudits,
  ScoredCategoryConfig,
  ScoredReport,
  WeighedAuditReport,
} from './scoring';

export function sortReport(report: ScoredReport): ScoredReport {
  const { categories, plugins } = report;
  const sortedCategories = categories.reduce<ScoredCategoryConfig[]>(
    (acc, category) => {
      const { audits, groups } = category.refs.reduce(
        (
          acc: {
            audits: WeighedAuditReport[];
            groups: EnrichedScoredAuditGroupWithAudits[];
          },
          ref: CategoryRef,
        ) => ({
          ...acc,
          ...(ref.type === 'group'
            ? {
                groups: [
                  ...acc.groups,
                  getGroupWithAudits(ref.slug, ref.plugin, plugins),
                ],
              }
            : {
                audits: [...acc.audits, getAuditByRef(ref, plugins)],
              }),
        }),
        { groups: [], audits: [] },
      );
      const sortedAuditsAndGroups = [
        ...groups,
        ...audits.sort(sortCategoryAudits),
      ];
      const sortedRefs = category.refs.slice().sort((a, b) => {
        const aIndex = sortedAuditsAndGroups.findIndex(
          ref => ref.slug === a.slug,
        );
        const bIndex = sortedAuditsAndGroups.findIndex(
          ref => ref.slug === b.slug,
        );
        return aIndex - bIndex;
      });

      return [...acc, { ...category, refs: sortedRefs }];
    },
    [],
  );

  const sortedPlugins = plugins.map(plugin => ({
    ...plugin,
    audits: plugin.audits.sort(sortAudits).map(audit => ({
      ...audit,
      details: {
        ...audit.details,
        issues: audit?.details?.issues.slice().sort(compareIssues) || [],
      },
    })),
  }));

  return {
    ...report,
    categories: sortedCategories,
    plugins: sortedPlugins,
  };
}
