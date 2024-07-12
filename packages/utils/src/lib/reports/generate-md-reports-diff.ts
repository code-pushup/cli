import {
  AuditDiff,
  ReportsDiff,
  Table,
  TableColumnObject,
} from '@code-pushup/models';
import { pluralize, pluralizeToken } from '../formatting';
import { html, md } from '../text-formats';
import { objectToEntries } from '../transform';
import { DiffOutcome } from './types';
import {
  colorByScoreDiff,
  formatDiffNumber,
  formatScoreWithColor,
  getDiffMarker,
  scoreMarker,
} from './utils';

const {
  h1,
  h2,
  lines,
  link,
  bold: boldMd,
  italic: italicMd,
  table,
  section,
} = md;
const { details } = html;

// to prevent exceeding Markdown comment character limit
const MAX_ROWS = 100;

export function generateMdReportsDiff(diff: ReportsDiff): string {
  return lines(
    section(formatDiffHeaderSection(diff)),
    formatDiffCategoriesSection(diff),
    formatDiffGroupsSection(diff),
    formatDiffAuditsSection(diff),
  );
}

function formatDiffHeaderSection(diff: ReportsDiff): string {
  const outcomeTexts: Record<DiffOutcome, string> = {
    positive: `🥳 Code PushUp report has ${boldMd('improved')}`,
    negative: `😟 Code PushUp report has ${boldMd('regressed')}`,
    mixed: `🤨 Code PushUp report has both ${boldMd(
      'improvements and regressions',
    )}`,
    unchanged: `😐 Code PushUp report is ${boldMd('unchanged')}`,
  };
  const outcome = mergeDiffOutcomes(
    changesToDiffOutcomes([
      ...diff.categories.changed,
      ...diff.groups.changed,
      ...diff.audits.changed,
    ]),
  );

  const styleCommits = (commits: NonNullable<ReportsDiff['commits']>) =>
    `compared target commit ${commits.after.hash} with source commit ${commits.before.hash}`;

  return lines(
    h1('Code PushUp'),
    diff.commits
      ? `${outcomeTexts[outcome]} – ${styleCommits(diff.commits)}.`
      : `${outcomeTexts[outcome]}.`,
  );
}

function formatDiffCategoriesSection(diff: ReportsDiff): string {
  const { changed, unchanged, added } = diff.categories;

  const categoriesCount = changed.length + unchanged.length + added.length;
  const hasChanges = unchanged.length < categoriesCount;

  if (categoriesCount === 0) {
    return '';
  }

  const columns: TableColumnObject[] = [
    { key: 'category', label: '🏷️ Category', align: 'left' },
    { key: 'before', label: hasChanges ? '⭐ Previous score' : '⭐ Score' },
    { key: 'after', label: '⭐ Current score' },
    { key: 'change', label: '🔄 Score change' },
  ];
  return lines(
    h2('🏷️ Categories'),
    categoriesCount > 0 &&
      table({
        columns: hasChanges ? columns : columns.slice(0, 2),
        rows: [
          ...sortChanges(changed).map(category => ({
            category: formatTitle(category),
            after: formatScoreWithColor(category.scores.after),
            before: formatScoreWithColor(category.scores.before, {
              skipBold: true,
            }),
            change: formatScoreChange(category.scores.diff),
          })),
          ...added.map(category => ({
            category: formatTitle(category),
            after: formatScoreWithColor(category.score),
            before: italicMd('n/a (\\*)'),
            change: italicMd('n/a (\\*)'),
          })),
          ...unchanged.map(category => ({
            category: formatTitle(category),
            after: formatScoreWithColor(category.score),
            before: formatScoreWithColor(category.score, { skipBold: true }),
            change: '–',
          })),
        ].map(row =>
          hasChanges ? row : { category: row.category, before: row.before },
        ),
      }),
    added.length > 0 && section(italicMd('(\\*) New category.')),
  );
}

function formatDiffGroupsSection(diff: ReportsDiff): string {
  if (diff.groups.changed.length + diff.groups.unchanged.length === 0) {
    return '';
  }
  return lines(
    h2('🗃️ Groups'),
    formatGroupsOrAuditsDetails('group', diff.groups, {
      columns: [
        { key: 'plugin', label: '🔌 Plugin', align: 'left' },
        { key: 'group', label: '🗃️ Group', align: 'left' },
        { key: 'before', label: '⭐ Previous score' },
        { key: 'after', label: '⭐ Current score' },
        { key: 'change', label: '🔄 Score change' },
      ],
      rows: sortChanges(diff.groups.changed).map(group => ({
        plugin: formatTitle(group.plugin),
        group: formatTitle(group),
        after: formatScoreWithColor(group.scores.after),
        before: formatScoreWithColor(group.scores.before, { skipBold: true }),
        change: formatScoreChange(group.scores.diff),
      })),
    }),
  );
}

function formatDiffAuditsSection(diff: ReportsDiff): string {
  return lines(
    h2('🛡️ Audits'),
    formatGroupsOrAuditsDetails('audit', diff.audits, {
      columns: [
        { key: 'plugin', label: '🔌 Plugin', align: 'left' },
        { key: 'audit', label: '🛡️ Audit', align: 'left' },
        { key: 'before', label: '📏 Previous value' },
        { key: 'after', label: '📏 Current value' },
        { key: 'change', label: '🔄 Value change' },
      ],
      rows: sortChanges(diff.audits.changed).map(audit => ({
        plugin: formatTitle(audit.plugin),
        audit: formatTitle(audit),
        after: `${scoreMarker(audit.scores.after, 'square')} ${boldMd(
          audit.displayValues.after || audit.values.after.toString(),
        )}`,
        before: `${scoreMarker(audit.scores.before, 'square')} ${
          audit.displayValues.before || audit.values.before.toString()
        }`,
        change: formatValueChange(audit),
      })),
    }),
  );
}

function formatGroupsOrAuditsDetails<T extends 'group' | 'audit'>(
  token: T,
  { changed, unchanged }: ReportsDiff[`${T}s`],
  tableData: Table,
): string {
  return changed.length === 0
    ? summarizeUnchanged(token, { changed, unchanged })
    : details(
        summarizeDiffOutcomes(changesToDiffOutcomes(changed), token),
        lines(
          table({
            ...tableData,
            rows: tableData.rows.slice(0, MAX_ROWS) as never, // use never to avoid typing problem
          }),
          changed.length > MAX_ROWS &&
            italicMd(
              `Only the ${MAX_ROWS} most affected ${pluralize(
                token,
              )} are listed above for brevity.`,
            ),
          unchanged.length > 0 &&
            summarizeUnchanged(token, { changed, unchanged }),
        ),
      );
}

function formatScoreChange(diff: number): string {
  const marker = getDiffMarker(diff);
  const text = formatDiffNumber(Math.round(diff * 1000) / 10); // round with max 1 decimal
  return colorByScoreDiff(`${marker} ${text}`, diff);
}

function formatValueChange({
  values,
  scores,
}: Pick<AuditDiff, 'values' | 'scores'>): string {
  const marker = getDiffMarker(values.diff);
  const percentage =
    values.before === 0
      ? values.diff > 0
        ? Number.POSITIVE_INFINITY
        : Number.NEGATIVE_INFINITY
      : Math.round((100 * values.diff) / values.before);
  // eslint-disable-next-line no-irregular-whitespace
  const text = `${formatDiffNumber(percentage)} %`;
  return colorByScoreDiff(`${marker} ${text}`, scores.diff);
}

function summarizeUnchanged(
  token: 'category' | 'group' | 'audit',
  { changed, unchanged }: { changed: unknown[]; unchanged: unknown[] },
): string {
  return section(
    [
      changed.length > 0
        ? pluralizeToken(`other ${token}`, unchanged.length)
        : `All of ${pluralizeToken(token, unchanged.length)}`,
      unchanged.length === 1 ? 'is' : 'are',
      'unchanged.',
    ].join(' '),
  );
}

function summarizeDiffOutcomes(outcomes: DiffOutcome[], token: string): string {
  return objectToEntries(countDiffOutcomes(outcomes))
    .filter(
      (entry): entry is [Exclude<DiffOutcome, 'unchanged'>, number] =>
        entry[0] !== 'unchanged' && entry[1] > 0,
    )
    .map(([outcome, count]): string => {
      const formattedCount = `<strong>${count}</strong> ${pluralize(
        token,
        count,
      )}`;
      switch (outcome) {
        case 'positive':
          return `👍 ${formattedCount} improved`;
        case 'negative':
          return `👎 ${formattedCount} regressed`;
        case 'mixed':
          return `${formattedCount} changed without impacting score`;
      }
    })
    .join(', ');
}

function formatTitle({
  title,
  docsUrl,
}: {
  title: string;
  docsUrl?: string;
}): string {
  if (docsUrl) {
    return link(docsUrl, title);
  }
  return title;
}

type Change = {
  scores: { diff: number };
  values?: { diff: number };
};

function sortChanges<T extends Change>(changes: T[]): T[] {
  return [...changes].sort(
    (a, b) =>
      Math.abs(b.scores.diff) - Math.abs(a.scores.diff) ||
      Math.abs(b.values?.diff ?? 0) - Math.abs(a.values?.diff ?? 0),
  );
}

function changesToDiffOutcomes(changes: Change[]): DiffOutcome[] {
  return changes.map((change): DiffOutcome => {
    if (change.scores.diff > 0) {
      return 'positive';
    }
    if (change.scores.diff < 0) {
      return 'negative';
    }
    if (change.values != null && change.values.diff !== 0) {
      return 'mixed';
    }
    return 'unchanged';
  });
}

function mergeDiffOutcomes(outcomes: DiffOutcome[]): DiffOutcome {
  if (outcomes.every(outcome => outcome === 'unchanged')) {
    return 'unchanged';
  }
  if (outcomes.includes('positive') && !outcomes.includes('negative')) {
    return 'positive';
  }
  if (outcomes.includes('negative') && !outcomes.includes('positive')) {
    return 'negative';
  }
  return 'mixed';
}

function countDiffOutcomes(
  outcomes: DiffOutcome[],
): Record<DiffOutcome, number> {
  return {
    positive: outcomes.filter(outcome => outcome === 'positive').length,
    negative: outcomes.filter(outcome => outcome === 'negative').length,
    mixed: outcomes.filter(outcome => outcome === 'mixed').length,
    unchanged: outcomes.filter(outcome => outcome === 'unchanged').length,
  };
}
