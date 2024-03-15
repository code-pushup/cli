import { join } from 'node:path';
import {
  AuditReport,
  CategoryRef,
  IssueSeverity as CliIssueSeverity,
  Format,
  Group,
  Issue,
  PersistConfig,
  Report,
  reportSchema,
} from '@code-pushup/models';
import {
  ensureDirectoryExists,
  readJsonFile,
  readTextFile,
} from '../file-system';
import { SCORE_COLOR_RANGE } from './constants';
import { image, style } from './md';
import { ScoredReport, SortableAuditReport, SortableGroup } from './types';

export function formatReportScore(score: number): string {
  return Math.round(score * 100).toString();
}

export function formatScoreWithColor(
  score: number,
  options?: { skipBold?: boolean },
): string {
  const styledNumber = options?.skipBold
    ? formatReportScore(score)
    : style(formatReportScore(score));
  return `${getRoundScoreMarker(score)} ${styledNumber}`;
}

export function getRoundScoreMarker(score: number): string {
  if (score >= SCORE_COLOR_RANGE.GREEN_MIN) {
    return '🟢';
  }
  if (score >= SCORE_COLOR_RANGE.YELLOW_MIN) {
    return '🟡';
  }
  return '🔴';
}

export function getSquaredScoreMarker(score: number): string {
  if (score >= SCORE_COLOR_RANGE.GREEN_MIN) {
    return '🟩';
  }
  if (score >= SCORE_COLOR_RANGE.YELLOW_MIN) {
    return '🟨';
  }
  return '🟥';
}

export function getDiffMarker(diff: number): string {
  if (diff > 0) {
    return '🠉';
  }
  if (diff < 0) {
    return '🠋';
  }
  return '';
}

export function colorByScoreDiff(text: string, diff: number): string {
  const color = diff > 0 ? 'green' : diff < 0 ? 'red' : 'gray';
  return shieldsBadge(text, color);
}

export function shieldsBadge(text: string, color: string): string {
  return image(
    `https://img.shields.io/badge/${encodeURIComponent(text)}-${color}`,
    text,
  );
}

export function formatDiffNumber(diff: number): string {
  const number =
    Math.abs(diff) === Number.POSITIVE_INFINITY ? '∞' : `${Math.abs(diff)}`;
  const sign = diff < 0 ? '−' : '+';
  return `${sign}${number}`;
}

export function getSeverityIcon(
  severity: 'info' | 'warning' | 'error',
): string {
  if (severity === 'error') {
    return '🚨';
  }
  if (severity === 'warning') {
    return '⚠️';
  }
  return 'ℹ️';
}

export function calcDuration(start: number, stop?: number): number {
  return Math.floor((stop ?? performance.now()) - start);
}

export function countWeightedRefs(refs: CategoryRef[]) {
  return refs
    .filter(({ weight }) => weight > 0)
    .reduce((sum, { weight }) => sum + weight, 0);
}

export function countCategoryAudits(
  refs: CategoryRef[],
  plugins: ScoredReport['plugins'],
): number {
  // Create lookup object for groups within each plugin
  const groupLookup = plugins.reduce<Record<string, Record<string, Group>>>(
    (lookup, plugin) => {
      if (plugin.groups == null || plugin.groups.length === 0) {
        return lookup;
      }

      return {
        ...lookup,
        [plugin.slug]: Object.fromEntries(
          plugin.groups.map(group => [group.slug, group]),
        ),
      };
    },
    {},
  );

  // Count audits
  return refs.reduce((acc, ref) => {
    if (ref.type === 'group') {
      const groupRefs = groupLookup[ref.plugin]?.[ref.slug]?.refs;
      return acc + (groupRefs?.length ?? 0);
    }
    return acc + 1;
  }, 0);
}

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

export function compareCategoryAuditsAndGroups(
  a: SortableAuditReport | SortableGroup,
  b: SortableAuditReport | SortableGroup,
): number {
  if (a.weight !== b.weight) {
    return b.weight - a.weight;
  }

  if (a.score !== b.score) {
    return a.score - b.score;
  }

  if ('value' in a && 'value' in b && a.value !== b.value) {
    return b.value - a.value;
  }

  return a.title.localeCompare(b.title);
}

export function compareAudits(a: AuditReport, b: AuditReport): number {
  if (a.score !== b.score) {
    return a.score - b.score;
  }

  if (a.value !== b.value) {
    return b.value - a.value;
  }

  return a.title.localeCompare(b.title);
}

export function compareIssueSeverity(
  severity1: CliIssueSeverity,
  severity2: CliIssueSeverity,
): number {
  const levels: Record<CliIssueSeverity, number> = {
    info: 0,
    warning: 1,
    error: 2,
  };
  return levels[severity1] - levels[severity2];
}

type LoadedReportFormat<T extends Format> = T extends 'json' ? Report : string;

export async function loadReport<T extends Format>(
  options: Required<Omit<PersistConfig, 'format'>> & {
    format: T;
  },
): Promise<LoadedReportFormat<T>> {
  const { outputDir, filename, format } = options;
  await ensureDirectoryExists(outputDir);
  const filePath = join(outputDir, `${filename}.${format}`);

  if (format === 'json') {
    const content = await readJsonFile(filePath);
    return reportSchema.parse(content) as LoadedReportFormat<T>;
  }

  const text = await readTextFile(filePath);
  return text as LoadedReportFormat<T>;
}

export function throwIsNotPresentError(
  itemName: string,
  presentPlace: string,
): never {
  throw new Error(`${itemName} is not present in ${presentPlace}`);
}

export function getPluginNameFromSlug(
  slug: string,
  plugins: ScoredReport['plugins'],
): string {
  return (
    plugins.find(({ slug: pluginSlug }) => pluginSlug === slug)?.title || slug
  );
}

export function compareIssues(a: Issue, b: Issue): number {
  if (a.severity !== b.severity) {
    return -compareIssueSeverity(a.severity, b.severity);
  }

  if (!a.source && b.source) {
    return -1;
  }

  if (a.source && !b.source) {
    return 1;
  }

  if (a.source?.file !== b.source?.file) {
    return a.source?.file.localeCompare(b.source?.file || '') ?? 0;
  }

  if (!a.source?.position && b.source?.position) {
    return -1;
  }

  if (a.source?.position && !b.source?.position) {
    return 1;
  }

  if (a.source?.position?.startLine !== b.source?.position?.startLine) {
    return (
      (a.source?.position?.startLine ?? 0) -
      (b.source?.position?.startLine ?? 0)
    );
  }

  return 0;
}
