import { AuditReport, CategoryRef, PluginReport } from '@code-pushup/models';
import {
  EnrichedScoredGroup,
  ScoredReport,
  WeighedAuditReport,
  WeighedScoredGroup,
  compareAudits,
  compareCategoryAuditsAndGroups,
  compareIssues,
  getAuditByRef,
  getGroupWithAudits,
} from './utils';

export function sortReport(report: ScoredReport): ScoredReport {
  const { categories, plugins } = report;
  const sortedCategories = categories.map(category => {
    const { audits, groups } = category.refs.reduce(
      (
        acc: {
          audits: WeighedAuditReport[];
          groups: WeighedScoredGroup[];
        },
        ref: CategoryRef,
      ) => ({
        ...acc,
        ...(ref.type === 'group'
          ? {
              groups: [...acc.groups, getGroupWithAudits(ref, plugins)],
            }
          : {
              audits: [...acc.audits, getAuditByRef(ref, plugins)],
            }),
      }),
      { groups: [], audits: [] },
    );
    const sortedAuditsAndGroups = [...audits, ...groups].sort(
      compareCategoryAuditsAndGroups,
    );

    const sortedRefs = [...category.refs].sort((a, b) => {
      const aIndex = sortedAuditsAndGroups.findIndex(
        ref => ref.slug === a.slug && ref.plugin === a.plugin,
      );
      const bIndex = sortedAuditsAndGroups.findIndex(
        ref => ref.slug === b.slug && ref.plugin === b.plugin,
      );
      return aIndex - bIndex;
    });

    return { ...category, refs: sortedRefs };
  });

  return {
    ...report,
    categories: sortedCategories,
    plugins: sortPlugins(plugins),
  };
}

function sortPlugins(
  plugins: (Omit<PluginReport, 'audits' | 'groups'> & {
    audits: AuditReport[];
    groups: EnrichedScoredGroup[];
  })[],
) {
  return plugins.map(plugin => ({
    ...plugin,
    audits: [...plugin.audits].sort(compareAudits).map(audit =>
      audit.details?.issues
        ? {
            ...audit,
            details: {
              ...audit.details,
              issues: [...audit.details.issues].sort(compareIssues),
            },
          }
        : audit,
    ),
  }));
}
