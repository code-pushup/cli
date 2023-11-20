import { join } from 'path';
import {
  AuditGroup,
  CategoryRef,
  IssueSeverity as CliIssueSeverity,
  Format,
  PersistConfig,
  Report,
  reportSchema,
} from '@code-pushup/models';
import {
  ensureDirectoryExists,
  readJsonFile,
  readTextFile,
} from './file-system';
import { EnrichedAuditReport, ScoredReport } from './scoring';
import { pluralize } from './transformation';

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
  if (score >= 0.9) {
    return '🟢';
  }
  if (score >= 0.5) {
    return '🟡';
  }
  return '🔴';
}

export function getSquaredScoreMarker(score: number): string {
  if (score >= 0.9) {
    return '🟩';
  }
  if (score >= 0.5) {
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

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(duration: number): string {
  if (duration < 1000) {
    return `${duration} ms`;
  }
  return `${(duration / 1000).toFixed(2)} s`;
}

export function calcDuration(start: number, stop?: number): number {
  stop = stop !== undefined ? stop : performance.now();
  return Math.floor(stop - start);
}

export function formatCount(count: number, name: string) {
  const text = count === 1 ? name : pluralize(name);
  return `${count} ${text}`;
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
  const groupLookup = plugins.reduce<
    Record<string, Record<string, AuditGroup>>
  >((lookup, plugin) => {
    if (!plugin.groups.length) {
      return lookup;
    }

    return {
      ...lookup,
      [plugin.slug]: {
        ...plugin.groups.reduce<Record<string, AuditGroup>>(
          (groupLookup, group) => {
            return {
              ...groupLookup,
              [group.slug]: group,
            };
          },
          {},
        ),
      },
    };
  }, {});

  // Count audits
  return refs.reduce((acc, ref) => {
    if (ref.type === 'group') {
      const groupRefs = groupLookup[ref.plugin]?.[ref.slug]?.refs;
      return acc + (groupRefs?.length || 0);
    }
    return acc + 1;
  }, 0);
}

export function getAuditsFromAllPlugins(
  report: ScoredReport,
): EnrichedAuditReport[] {
  return report.plugins.reduce<EnrichedAuditReport[]>(
    (acc, plugin) => [...acc, ...plugin.audits],
    [],
  );
}

export function sortAudits(
  a: EnrichedAuditReport,
  b: EnrichedAuditReport,
): number {
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
  options: Required<Pick<PersistConfig, 'outputDir' | 'filename'>> & {
    format: T;
  },
): Promise<LoadedReportFormat<T>> {
  const { outputDir, filename, format } = options;
  await ensureDirectoryExists(outputDir);
  const filePath = join(outputDir, `${filename}.${format}`);

  if (format === 'json') {
    const content = await readJsonFile(filePath);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reportSchema.parse(content) as any;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return readTextFile(filePath) as any;
}
