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
import {
  EnrichedScoredGroupWithAudits,
  ScoredReport,
  WeighedAuditReport,
} from './scoring';

export const FOOTER_PREFIX = 'Made with ❤ by'; // replace ❤️ with ❤, because of ❤️ has output issues
export const CODE_PUSHUP_DOMAIN = 'code-pushup.dev';
export const README_LINK =
  'https://github.com/flowup/quality-metrics-cli#readme';
export const reportHeadlineText = 'Code PushUp Report';
export const reportOverviewTableHeaders = [
  '🏷 Category',
  '⭐ Score',
  '🛡 Audits',
];
export const reportRawOverviewTableHeaders = ['Category', 'Score', 'Audits'];
export const reportMetaTableHeaders: string[] = [
  'Commit',
  'Version',
  'Duration',
  'Plugins',
  'Categories',
  'Audits',
];

export const pluginMetaTableHeaders: string[] = [
  'Plugin',
  'Audits',
  'Version',
  'Duration',
];

// details headers

export const detailsTableHeaders: string[] = [
  'Severity',
  'Message',
  'Source file',
  'Line(s)',
];

export function formatReportScore(score: number): string {
  return Math.round(score * 100).toString();
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
      if (plugin.groups.length === 0) {
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

export function getAuditByRef(
  { slug, weight, plugin }: CategoryRef,
  plugins: ScoredReport['plugins'],
): WeighedAuditReport {
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
  };
}

export function getGroupWithAudits(
  refSlug: string,
  refPlugin: string,
  plugins: ScoredReport['plugins'],
): EnrichedScoredGroupWithAudits {
  const plugin = plugins.find(({ slug }) => slug === refPlugin);
  if (!plugin) {
    throwIsNotPresentError(`Plugin ${refPlugin}`, 'report');
  }
  const groupWithAudits = plugin.groups?.find(({ slug }) => slug === refSlug);

  if (!groupWithAudits) {
    throwIsNotPresentError(`Group ${refSlug}`, plugin.slug);
  }
  const groupAudits = groupWithAudits.refs.reduce<WeighedAuditReport[]>(
    (acc: WeighedAuditReport[], ref) => {
      const audit = getAuditByRef(
        { ...ref, plugin: refPlugin, type: 'audit' },
        plugins,
      );
      return [...acc, audit];
    },
    [],
  );
  const audits = [...groupAudits].sort(compareCategoryAudits);

  return {
    ...groupWithAudits,
    audits,
  };
}

export function compareCategoryAudits(
  a: WeighedAuditReport,
  b: WeighedAuditReport,
): number {
  if (a.weight !== b.weight) {
    return b.weight - a.weight;
  }

  if (a.score !== b.score) {
    return a.score - b.score;
  }

  if (a.value !== b.value) {
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
