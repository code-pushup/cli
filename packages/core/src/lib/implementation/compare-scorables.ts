import {
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
  Diff,
  ScoredCategoryConfig,
  ScoredGroup,
  ScoredReport,
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
    before: reports.before.categories,
    after: reports.after.categories,
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
    slug: category.slug,
    title: category.title,
    score: category.score,
  };
}

function categoryPairToDiff({
  before,
  after,
}: Diff<ScoredCategoryConfig>): CategoryDiff {
  return {
    slug: after.slug,
    title: after.title,
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
    slug: group.slug,
    title: group.title,
    plugin: {
      slug: plugin.slug,
      title: plugin.title,
    },
    score: group.score,
  };
}

function pluginGroupPairToDiff({
  before,
  after,
}: Diff<PluginGroup>): GroupDiff {
  return {
    slug: after.group.slug,
    title: after.group.title,
    plugin: {
      slug: after.plugin.slug,
      title: after.plugin.title,
    },
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
    slug: audit.slug,
    title: audit.title,
    plugin: {
      slug: plugin.slug,
      title: plugin.title,
    },
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
    slug: after.audit.slug,
    title: after.audit.title,
    plugin: {
      slug: after.plugin.slug,
      title: after.plugin.title,
    },
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
