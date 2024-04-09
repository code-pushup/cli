import { AuditDiff, ReportsDiff } from '@code-pushup/models';
import { pluralize, pluralizeToken } from '../formatting';
import { objectToEntries } from '../transform';
import { Alignment, details, h1, h2, paragraphs, style, tableMd } from './md';
import { DiffOutcome } from './types';
import {
  colorByScoreDiff,
  formatDiffNumber,
  formatScoreWithColor,
  getDiffMarker,
  getSquaredScoreMarker,
} from './utils';

// to prevent exceeding Markdown comment character limit
const MAX_ROWS = 100;

export function generateMdReportsDiff(diff: ReportsDiff): string {
  return paragraphs(
    formatDiffHeaderSection(diff),
    formatDiffCategoriesSection(diff),
    formatDiffGroupsSection(diff),
    formatDiffAuditsSection(diff),
  );
}

function formatDiffHeaderSection(diff: ReportsDiff): string {
  const outcomeTexts: Record<DiffOutcome, string> = {
    positive: `🥳 Code PushUp report has ${style('improved')}`,
    negative: `😟 Code PushUp report has ${style('regressed')}`,
    mixed: `🤨 Code PushUp report has both ${style(
      'improvements and regressions',
    )}`,
    unchanged: `😐 Code PushUp report is ${style('unchanged')}`,
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

  return paragraphs(
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

  return paragraphs(
    h2('🏷️ Categories'),
    categoriesCount > 0 &&
      tableMd(
        [
          [
            '🏷️ Category',
            hasChanges ? '⭐ Current score' : '⭐ Score',
            '⭐ Previous score',
            '🔄 Score change',
          ],
          ...sortChanges(changed).map(category => [
            category.title,
            formatScoreWithColor(category.scores.after),
            formatScoreWithColor(category.scores.before, { skipBold: true }),
            formatScoreChange(category.scores.diff),
          ]),
          ...added.map(category => [
            category.title,
            formatScoreWithColor(category.score),
            style('n/a (\\*)', ['i']),
            style('n/a (\\*)', ['i']),
          ]),
          ...unchanged.map(category => [
            category.title,
            formatScoreWithColor(category.score),
            formatScoreWithColor(category.score, { skipBold: true }),
            '–',
          ]),
        ].map(row => (hasChanges ? row : row.slice(0, 2))),
        hasChanges ? ['l', 'c', 'c', 'c'] : ['l', 'c'],
      ),
    added.length > 0 && style('(\\*) New category.', ['i']),
  );
}

function formatDiffGroupsSection(diff: ReportsDiff): string {
  if (diff.groups.changed.length + diff.groups.unchanged.length === 0) {
    return '';
  }
  return paragraphs(
    h2('🎗️ Groups'),
    formatGroupsOrAuditsDetails('group', diff.groups, {
      headings: [
        '🔌 Plugin',
        '🗃️ Group',
        '⭐ Current score',
        '⭐ Previous score',
        '🔄 Score change',
      ],
      rows: sortChanges(diff.groups.changed).map(group => [
        group.plugin.title,
        group.title,
        formatScoreWithColor(group.scores.after),
        formatScoreWithColor(group.scores.before, { skipBold: true }),
        formatScoreChange(group.scores.diff),
      ]),
      align: ['l', 'l', 'c', 'c', 'c'],
    }),
  );
}

function formatDiffAuditsSection(diff: ReportsDiff): string {
  return paragraphs(
    h2('🛡️ Audits'),
    formatGroupsOrAuditsDetails('audit', diff.audits, {
      headings: [
        '🔌 Plugin',
        '🛡️ Audit',
        '📏 Current value',
        '📏 Previous value',
        '🔄 Value change',
      ],
      rows: sortChanges(diff.audits.changed).map(audit => [
        audit.plugin.title,
        audit.title,
        `${getSquaredScoreMarker(audit.scores.after)} ${style(
          audit.displayValues.after || audit.values.after.toString(),
        )}`,
        `${getSquaredScoreMarker(audit.scores.before)} ${
          audit.displayValues.before || audit.values.before.toString()
        }`,
        formatValueChange(audit),
      ]),
      align: ['l', 'l', 'c', 'c', 'c'],
    }),
  );
}

function formatGroupsOrAuditsDetails<T extends 'group' | 'audit'>(
  token: T,
  { changed, unchanged }: ReportsDiff[`${T}s`],
  table: { headings: string[]; rows: string[][]; align?: Alignment[] },
): string {
  return changed.length === 0
    ? summarizeUnchanged(token, { changed, unchanged })
    : details(
        summarizeDiffOutcomes(changesToDiffOutcomes(changed), token),
        paragraphs(
          tableMd(
            [table.headings, ...table.rows.slice(0, MAX_ROWS)],
            table.align,
          ),
          changed.length > MAX_ROWS &&
            style(
              `Only the ${MAX_ROWS} most affected ${pluralize(
                token,
              )} are listed above for brevity.`,
              ['i'],
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
  return [
    changed.length > 0
      ? pluralizeToken(`other ${token}`, unchanged.length)
      : `All of ${pluralizeToken(token, unchanged.length)}`,
    unchanged.length === 1 ? 'is' : 'are',
    'unchanged.',
  ].join(' ');
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
