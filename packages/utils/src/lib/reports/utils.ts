import ansis, { type Ansis } from 'ansis';
import { type InlineText, md } from 'build-md';
import type {
  AuditDiff,
  AuditReport,
  CategoryRef,
  IssueSeverity as CliIssueSeverity,
  Group,
  Issue,
} from '@code-pushup/models';
import { SCORE_COLOR_RANGE } from './constants';
import type { ScoredReport, SortableAuditReport, SortableGroup } from './types';

export function formatReportScore(score: number): string {
  const scaledScore = score * 100;
  const roundedScore = Math.round(scaledScore);

  return roundedScore === 100 && score !== 1
    ? Math.floor(scaledScore).toString()
    : roundedScore.toString();
}

export function formatScoreWithColor(
  score: number,
  options?: { skipBold?: boolean },
): InlineText {
  const styledNumber = options?.skipBold
    ? formatReportScore(score)
    : md.bold(formatReportScore(score));
  return md`${scoreMarker(score)} ${styledNumber}`;
}

export type MarkerShape = 'circle' | 'square';
export type ScoreColors = 'red' | 'yellow' | 'green';
export const MARKERS: Record<MarkerShape, Record<ScoreColors, string>> = {
  circle: {
    red: '🔴',
    yellow: '🟡',
    green: '🟢',
  },
  square: {
    red: '🟥',
    yellow: '🟨',
    green: '🟩',
  },
};

export function scoreMarker(
  score: number,
  markerType: MarkerShape = 'circle',
): string {
  if (score >= SCORE_COLOR_RANGE.GREEN_MIN) {
    return MARKERS[markerType].green;
  }
  if (score >= SCORE_COLOR_RANGE.YELLOW_MIN) {
    return MARKERS[markerType].yellow;
  }
  return MARKERS[markerType].red;
}

export function getDiffMarker(diff: number): string {
  if (diff > 0) {
    return '↑';
  }
  if (diff < 0) {
    return '↓';
  }
  return '';
}

export function colorByScoreDiff(text: string, diff: number): InlineText {
  const color = diff > 0 ? 'green' : diff < 0 ? 'red' : 'gray';
  return shieldsBadge(text, color);
}

export function shieldsBadge(text: string, color: string): InlineText {
  return md.image(
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

export function severityMarker(severity: 'info' | 'warning' | 'error'): string {
  if (severity === 'error') {
    return '🚨';
  }
  if (severity === 'warning') {
    return '⚠️';
  }
  return 'ℹ️';
}

const MIN_NON_ZERO_RESULT = 0.1;

export function roundValue(value: number): number {
  const roundedValue = Math.round(value * 10) / 10; // round with max 1 decimal
  if (Math.abs(value) < 1 && value !== 0) {
    return roundedValue === 0
      ? MIN_NON_ZERO_RESULT * Math.sign(value)
      : roundedValue;
  }
  return roundedValue;
}

export function formatScoreChange(diff: number): InlineText {
  const marker = getDiffMarker(diff);
  const text = formatDiffNumber(roundValue(diff * 100));
  return colorByScoreDiff(`${marker} ${text}`, diff);
}

export function formatValueChange({
  values,
  scores,
}: Pick<AuditDiff, 'values' | 'scores'>): InlineText {
  const marker = getDiffMarker(values.diff);
  const percentage =
    values.before === 0
      ? values.diff > 0
        ? Number.POSITIVE_INFINITY
        : Number.NEGATIVE_INFINITY
      : roundValue((values.diff / values.before) * 100);
  // eslint-disable-next-line no-irregular-whitespace
  const text = `${formatDiffNumber(percentage)} %`;
  return colorByScoreDiff(`${marker} ${text}`, scores.diff);
}

export function calcDuration(start: number, stop?: number): number {
  return Math.round((stop ?? performance.now()) - start);
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

export function compareCategoryAuditsAndGroups(
  a: SortableAuditReport | SortableGroup,
  b: SortableAuditReport | SortableGroup,
): number {
  if (a.score !== b.score) {
    return a.score - b.score;
  }

  if (a.weight !== b.weight) {
    return b.weight - a.weight;
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

// @TODO rethink implementation
export function applyScoreColor(
  { score, text }: { score: number; text?: string },
  style: Ansis = ansis,
) {
  const formattedScore = text ?? formatReportScore(score);

  if (score >= SCORE_COLOR_RANGE.GREEN_MIN) {
    return text
      ? style.green(formattedScore)
      : style.bold(style.green(formattedScore));
  }

  if (score >= SCORE_COLOR_RANGE.YELLOW_MIN) {
    return text
      ? style.yellow(formattedScore)
      : style.bold(style.yellow(formattedScore));
  }

  return text
    ? style.red(formattedScore)
    : style.bold(style.red(formattedScore));
}

export function targetScoreIcon(
  score: number,
  targetScore?: number,
  options: {
    passIcon?: string;
    failIcon?: string;
    prefix?: string;
    postfix?: string;
  } = {},
): string {
  if (targetScore != null) {
    const {
      passIcon = '✅',
      failIcon = '❌',
      prefix = '',
      postfix = '',
    } = options;
    if (score >= targetScore) {
      return `${prefix}${passIcon}${postfix}`;
    }
    return `${prefix}${failIcon}${postfix}`;
  }
  return '';
}
