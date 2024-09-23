import type {
  AuditReport,
  CategoryRef,
  Group,
  PluginReport,
} from '@code-pushup/models';
import type {
  ScoredGroup,
  ScoredReport,
  SortableAuditReport,
  SortableGroup,
} from './types';
import {
  compareAudits,
  compareCategoryAuditsAndGroups,
  compareIssues,
  throwIsNotPresentError,
} from './utils';

export function getSortableAuditByRef(
  { slug, weight, plugin }: CategoryRef,
  plugins: ScoredReport['plugins'],
): SortableAuditReport {
  const auditPlugin = plugins.find(p => p.slug === plugin);
  if (!auditPlugin) {
    throwIsNotPresentError(`Plugin ${plugin}`, 'report');
  }
  const audit = auditPlugin.audits.find(
    ({ slug: auditSlug }) => auditSlug === slug,
  );
  if (!audit) {
    throwIsNotPresentError(`Audit ${slug}`, auditPlugin.slug);
  }
  return {
    ...audit,
    weight,
    plugin,
  };
}

export function getSortedGroupAudits(
  group: Group,
  plugin: string,
  plugins: ScoredReport['plugins'],
): SortableAuditReport[] {
  return group.refs
    .map(ref =>
      getSortableAuditByRef(
        {
          plugin,
          slug: ref.slug,
          weight: ref.weight,
          type: 'audit',
        },
        plugins,
      ),
    )
    .sort(compareCategoryAuditsAndGroups);
}

export function getSortableGroupByRef(
  { plugin, slug, weight }: CategoryRef,
  plugins: ScoredReport['plugins'],
): SortableGroup {
  const groupPlugin = plugins.find(p => p.slug === plugin);
  if (!groupPlugin) {
    throwIsNotPresentError(`Plugin ${plugin}`, 'report');
  }

  const group = groupPlugin.groups?.find(
    ({ slug: groupSlug }) => groupSlug === slug,
  );
  if (!group) {
    throwIsNotPresentError(`Group ${slug}`, groupPlugin.slug);
  }

  const sortedAudits = getSortedGroupAudits(group, groupPlugin.slug, plugins);
  const sortedAuditRefs = [...group.refs].sort((a, b) => {
    const aIndex = sortedAudits.findIndex(ref => ref.slug === a.slug);
    const bIndex = sortedAudits.findIndex(ref => ref.slug === b.slug);
    return aIndex - bIndex;
  });

  return {
    ...group,
    refs: sortedAuditRefs,
    plugin,
    weight,
  };
}

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
