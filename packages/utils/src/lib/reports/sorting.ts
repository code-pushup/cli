import { AuditReport, CategoryRef, PluginReport } from '@code-pushup/models';
import {
  ScoredGroup,
  ScoredReport,
  SortableAuditReport,
  SortableGroup,
} from './types';
import {
  compareAudits,
  compareCategoryAuditsAndGroups,
  compareIssues,
  getSortableAuditByRef,
  getSortableGroupByRef,
} from './utils';

export function sortReport(report: ScoredReport): ScoredReport {
  const { categories, plugins } = report;
  const sortedCategories = categories.map(category => {
    const { audits, groups } = category.refs.reduce(
      (
        acc: {
          audits: SortableAuditReport[];
          groups: SortableGroup[];
        },
        ref: CategoryRef,
      ) => ({
        ...acc,
        ...(ref.type === 'group'
          ? {
              groups: [...acc.groups, getSortableGroupByRef(ref, plugins)],
            }
          : {
              audits: [...acc.audits, getSortableAuditByRef(ref, plugins)],
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

// NOTE: Only audits are sorted as groups are only listed within categories, not separately
function sortPlugins(
  plugins: (Omit<PluginReport, 'audits' | 'groups'> & {
    audits: AuditReport[];
    groups?: ScoredGroup[];
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
