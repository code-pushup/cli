import { AuditDiff, Commit, ReportsDiff } from '@code-pushup/models';
import { pluralize, pluralizeToken } from '../formatting';
import { objectToEntries } from '../transform';
import {
  Alignment,
  details,
  h1,
  h2,
  li,
  paragraphs,
  style,
  tableMd,
} from './md';
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
    neutral: `😐 Code PushUp report is ${style('unchanged')}`,
    mixed: `🤨 Code PushUp report has both ${style(
      'improvements and regressions',
    )}`,
  };
  const outcome = mergeDiffOutcomes(
    changesToDiffOutcomes([
      ...diff.categories.changed,
      ...diff.groups.changed,
      ...diff.audits.changed,
    ]),
  );

  const styleCommit = (commit: Commit) => style(commit.hash.slice(0, 7), ['c']);
  const styleCommits = (commits: NonNullable<ReportsDiff['commits']>) => {
    const src = styleCommit(commits.before);
    const tgt = styleCommit(commits.after);
    return `compared target commit ${tgt} with source commit ${src}`;
  };

  return paragraphs(
    h1('Code PushUp'),
    diff.commits
      ? `${outcomeTexts[outcome]} – ${styleCommits(diff.commits)}.`
      : `${outcomeTexts[outcome]}.`,
  );
}

function formatDiffCategoriesSection(diff: ReportsDiff): string {
  const { changed, unchanged } = diff.categories;
  if (changed.length + unchanged.length === 0) {
    return '';
  }
  return paragraphs(
    h2('🏷️ Categories'),
    changed.length > 0 &&
      tableMd(
        [
          [
            '🏷️ Category',
            '⭐ Current score',
            '⭐ Previous score',
            '🗠 Score change',
          ],
          ...changed.map(category => [
            category.title,
            formatScoreWithColor(category.scores.after),
            formatScoreWithColor(category.scores.before, { skipBold: true }),
            formatScoreChange(category.scores.diff),
          ]),
        ],
        ['l', 'c', 'c', 'c'],
      ),
    unchanged.length > 0 &&
      details(
        summarizeUnchanged('category', { changed, unchanged }),
        unchanged
          .map(category =>
            li(`${category.title}: ${formatScoreWithColor(category.score)}`),
          )
          .join('\n'),
      ),
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
        '🎗️ Group',
        '⭐ Current score',
        '⭐ Previous score',
        '🗠 Score change',
      ],
      rows: diff.groups.changed.map(group => [
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
        '🗠 Value change',
      ],
      rows: diff.audits.changed.map(audit => [
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
  const text = style(formatDiffNumber(Math.round(diff * 100)));
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
  const text = style(`${formatDiffNumber(percentage)}%`);
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
      (entry): entry is [Exclude<DiffOutcome, 'neutral'>, number] =>
        entry[0] !== 'neutral' && entry[1] > 0,
    )
    .map(([outcome, count]) => {
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

function changesToDiffOutcomes(
  changes: { scores: { diff: number }; values?: { diff: number } }[],
): DiffOutcome[] {
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
    return 'neutral';
  });
}

function mergeDiffOutcomes(outcomes: DiffOutcome[]): DiffOutcome {
  if (outcomes.length === 0) {
    return 'neutral';
  }
  if (
    outcomes.every(outcome => outcome === 'positive' || outcome === 'neutral')
  ) {
    return 'positive';
  }
  if (
    outcomes.every(outcome => outcome === 'negative' || outcome === 'neutral')
  ) {
    return 'negative';
  }
  if (outcomes.every(outcome => outcome === 'neutral')) {
    return 'neutral';
  }
  return 'mixed';
}

function countDiffOutcomes(
  outcomes: DiffOutcome[],
): Record<DiffOutcome, number> {
  return {
    positive: outcomes.filter(outcome => outcome === 'positive').length,
    negative: outcomes.filter(outcome => outcome === 'negative').length,
    neutral: outcomes.filter(outcome => outcome === 'neutral').length,
    mixed: outcomes.filter(outcome => outcome === 'mixed').length,
  };
}
