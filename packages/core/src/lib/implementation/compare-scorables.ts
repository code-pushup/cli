import type {
  AuditDiff,
  AuditReport,
  AuditResult,
  CategoryDiff,
  CategoryResult,
  GroupDiff,
  GroupResult,
  PluginMeta,
  ReportsDiff,
} from '@code-pushup/models';
import {
  type Diff,
  type ScoredCategoryConfig,
  type ScoredGroup,
  type ScoredReport,
  comparePairs,
  listAuditsFromAllPlugins,
  listGroupsFromAllPlugins,
  matchArrayItemsByKey,
} from '@code-pushup/utils';

export type ReportsToCompare = Diff<ScoredReport>;

export function compareCategories(
  reports: ReportsToCompare,
): ReportsDiff['categories'] {
  const { pairs, added, removed } = matchArrayItemsByKey({
    before: reports.before.categories ?? [],
    after: reports.after.categories ?? [],
    key: 'slug',
  });
  const { changed, unchanged } = comparePairs(
    pairs,
    ({ before, after }) => before.score === after.score,
  );

  return {
    changed: changed.map(categoryPairToDiff),
    unchanged: unchanged.map(categoryToResult),
    added: added.map(categoryToResult),
    removed: removed.map(categoryToResult),
  };
}

export function compareGroups(
  reports: ReportsToCompare,
): ReportsDiff['groups'] {
  const { pairs, added, removed } = matchArrayItemsByKey({
    before: listGroupsFromAllPlugins(reports.before),
    after: listGroupsFromAllPlugins(reports.after),
    key: ({ plugin, group }) => `${plugin.slug}/${group.slug}`,
  });
  const { changed, unchanged } = comparePairs(
    pairs,
    ({ before, after }) => before.group.score === after.group.score,
  );

  return {
    changed: changed.map(pluginGroupPairToDiff),
    unchanged: unchanged.map(pluginGroupToResult),
    added: added.map(pluginGroupToResult),
    removed: removed.map(pluginGroupToResult),
  };
}

export function compareAudits(
  reports: ReportsToCompare,
): ReportsDiff['audits'] {
  const { pairs, added, removed } = matchArrayItemsByKey({
    before: listAuditsFromAllPlugins(reports.before),
    after: listAuditsFromAllPlugins(reports.after),
    key: ({ plugin, audit }) => `${plugin.slug}/${audit.slug}`,
  });
  const { changed, unchanged } = comparePairs(
    pairs,
    ({ before, after }) =>
      before.audit.value === after.audit.value &&
      before.audit.score === after.audit.score,
  );

  return {
    changed: changed.map(pluginAuditPairToDiff),
    unchanged: unchanged.map(pluginAuditToResult),
    added: added.map(pluginAuditToResult),
    removed: removed.map(pluginAuditToResult),
  };
}

function categoryToResult(category: ScoredCategoryConfig): CategoryResult {
  return {
    ...selectMeta(category),
    score: category.score,
  };
}

function categoryPairToDiff({
  before,
  after,
}: Diff<ScoredCategoryConfig>): CategoryDiff {
  return {
    ...selectMeta(after),
    scores: {
      before: before.score,
      after: after.score,
      diff: after.score - before.score,
    },
  };
}

type PluginGroup = {
  group: ScoredGroup;
  plugin: PluginMeta;
};

function pluginGroupToResult({ group, plugin }: PluginGroup): GroupResult {
  return {
    ...selectMeta(group),
    plugin: selectMeta(plugin),
    score: group.score,
  };
}

function pluginGroupPairToDiff({
  before,
  after,
}: Diff<PluginGroup>): GroupDiff {
  return {
    ...selectMeta(after.group),
    plugin: selectMeta(after.plugin),
    scores: {
      before: before.group.score,
      after: after.group.score,
      diff: after.group.score - before.group.score,
    },
  };
}

type PluginAudit = {
  audit: AuditReport;
  plugin: PluginMeta;
};

function pluginAuditToResult({ audit, plugin }: PluginAudit): AuditResult {
  return {
    ...selectMeta(audit),
    plugin: selectMeta(plugin),
    score: audit.score,
    value: audit.value,
    displayValue: audit.displayValue,
  };
}

function pluginAuditPairToDiff({
  before,
  after,
}: Diff<PluginAudit>): AuditDiff {
  return {
    ...selectMeta(after.audit),
    plugin: selectMeta(after.plugin),
    scores: {
      before: before.audit.score,
      after: after.audit.score,
      diff: after.audit.score - before.audit.score,
    },
    values: {
      before: before.audit.value,
      after: after.audit.value,
      diff: after.audit.value - before.audit.value,
    },
    displayValues: {
      before: before.audit.displayValue,
      after: after.audit.displayValue,
    },
  };
}

function selectMeta<
  T extends ScoredCategoryConfig | ScoredGroup | AuditReport | PluginMeta,
>(meta: T): Pick<T, 'slug' | 'title' | 'docsUrl'> {
  return {
    slug: meta.slug,
    title: meta.title,
    ...(meta.docsUrl && {
      docsUrl: meta.docsUrl,
    }),
  };
}
