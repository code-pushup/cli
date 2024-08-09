import {
  InlineText,
  MarkdownDocument,
  TableColumnObject,
  TableRow,
  md,
} from 'build-md';
import { ReportsDiff } from '@code-pushup/models';
import { pluralize, pluralizeToken } from '../formatting';
import { HIERARCHY } from '../text-formats';
import { objectToEntries } from '../transform';
import { DiffOutcome } from './types';
import {
  formatScoreChange,
  formatScoreWithColor,
  formatValueChange,
  scoreMarker,
} from './utils';

// to prevent exceeding Markdown comment character limit
const MAX_ROWS = 100;

export function generateMdReportsDiff(
  diff: ReportsDiff,
  portalUrl?: string,
): string {
  return new MarkdownDocument()
    .$concat(
      createDiffHeaderSection(diff, portalUrl),
      createDiffCategoriesSection(diff),
      createDiffDetailsSection(diff),
    )
    .toString();
}

function createDiffHeaderSection(
  diff: ReportsDiff,
  portalUrl: string | undefined,
): MarkdownDocument {
  const outcomeTexts = {
    positive: md`🥳 Code PushUp report has ${md.bold('improved')}`,
    negative: md`😟 Code PushUp report has ${md.bold('regressed')}`,
    mixed: md`🤨 Code PushUp report has both ${md.bold(
      'improvements and regressions',
    )}`,
    unchanged: md`😐 Code PushUp report is ${md.bold('unchanged')}`,
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

  return new MarkdownDocument()
    .heading(HIERARCHY.level_1, 'Code PushUp')
    .paragraph(
      diff.commits
        ? md`${outcomeTexts[outcome]} – ${styleCommits(diff.commits)}.`
        : outcomeTexts[outcome],
    )
    .paragraph(
      portalUrl &&
        md.link(portalUrl, '🕵️ See full comparison in Code PushUp portal 🔍'),
    );
}

function createDiffCategoriesSection(
  diff: ReportsDiff,
): MarkdownDocument | null {
  const { changed, unchanged, added } = diff.categories;

  const categoriesCount = changed.length + unchanged.length + added.length;
  const hasChanges = unchanged.length < categoriesCount;

  if (categoriesCount === 0) {
    return null;
  }

  const columns: TableColumnObject[] = [
    { heading: '🏷️ Category', alignment: 'left' },
    {
      heading: hasChanges ? '⭐ Previous score' : '⭐ Score',
      alignment: 'center',
    },
    { heading: '⭐ Current score', alignment: 'center' },
    { heading: '🔄 Score change', alignment: 'center' },
  ];

  const rows: TableRow[] = [
    ...sortChanges(changed).map(category => [
      formatTitle(category),
      formatScoreWithColor(category.scores.before, {
        skipBold: true,
      }),
      formatScoreWithColor(category.scores.after),
      formatScoreChange(category.scores.diff),
    ]),
    ...added.map(category => [
      formatTitle(category),
      md.italic('n/a (\\*)'),
      formatScoreWithColor(category.score),
      md.italic('n/a (\\*)'),
    ]),
    ...unchanged.map(category => [
      formatTitle(category),
      formatScoreWithColor(category.score, { skipBold: true }),
      formatScoreWithColor(category.score),
      '–',
    ]),
  ];

  return new MarkdownDocument()
    .heading(HIERARCHY.level_2, '🏷️ Categories')
    .table(
      hasChanges ? columns : columns.slice(0, 2),
      rows.map(row => (hasChanges ? row : row.slice(0, 2))),
    )
    .paragraph(added.length > 0 && md.italic('(\\*) New category.'));
}

function createDiffDetailsSection(diff: ReportsDiff): MarkdownDocument | null {
  if (diff.groups.changed.length + diff.audits.changed.length === 0) {
    return null;
  }
  const summary = (['group', 'audit'] as const)
    .map(token =>
      summarizeDiffOutcomes(
        changesToDiffOutcomes(diff[`${token}s`].changed),
        token,
      ),
    )
    .filter(Boolean)
    .join(', ');
  const details = new MarkdownDocument().$concat(
    createDiffGroupsSection(diff),
    createDiffAuditsSection(diff),
  );
  return new MarkdownDocument().details(summary, details);
}

function createDiffGroupsSection(diff: ReportsDiff): MarkdownDocument | null {
  if (diff.groups.changed.length + diff.groups.unchanged.length === 0) {
    return null;
  }
  return new MarkdownDocument().heading(HIERARCHY.level_2, '🗃️ Groups').$concat(
    createGroupsOrAuditsDetails(
      'group',
      diff.groups,
      [
        { heading: '🔌 Plugin', alignment: 'left' },
        { heading: '🗃️ Group', alignment: 'left' },
        { heading: '⭐ Previous score', alignment: 'center' },
        { heading: '⭐ Current score', alignment: 'center' },
        { heading: '🔄 Score change', alignment: 'center' },
      ],
      sortChanges(diff.groups.changed).map(group => [
        formatTitle(group.plugin),
        formatTitle(group),
        formatScoreWithColor(group.scores.before, { skipBold: true }),
        formatScoreWithColor(group.scores.after),
        formatScoreChange(group.scores.diff),
      ]),
    ),
  );
}

function createDiffAuditsSection(diff: ReportsDiff): MarkdownDocument {
  return new MarkdownDocument().heading(HIERARCHY.level_2, '🛡️ Audits').$concat(
    createGroupsOrAuditsDetails(
      'audit',
      diff.audits,
      [
        { heading: '🔌 Plugin', alignment: 'left' },
        { heading: '🛡️ Audit', alignment: 'left' },
        { heading: '📏 Previous value', alignment: 'center' },
        { heading: '📏 Current value', alignment: 'center' },
        { heading: '🔄 Value change', alignment: 'center' },
      ],
      sortChanges(diff.audits.changed).map(audit => [
        formatTitle(audit.plugin),
        formatTitle(audit),
        `${scoreMarker(audit.scores.before, 'square')} ${
          audit.displayValues.before || audit.values.before.toString()
        }`,
        md`${scoreMarker(audit.scores.after, 'square')} ${md.bold(
          audit.displayValues.after || audit.values.after.toString(),
        )}`,
        formatValueChange(audit),
      ]),
    ),
  );
}

function createGroupsOrAuditsDetails<T extends 'group' | 'audit'>(
  token: T,
  { changed, unchanged }: ReportsDiff[`${T}s`],
  ...[columns, rows]: Parameters<(typeof md)['table']>
): MarkdownDocument {
  if (changed.length === 0) {
    return new MarkdownDocument().paragraph(
      summarizeUnchanged(token, { changed, unchanged }),
    );
  }
  return new MarkdownDocument()
    .table(columns, rows.slice(0, MAX_ROWS))
    .paragraph(
      changed.length > MAX_ROWS &&
        md.italic(
          `Only the ${MAX_ROWS} most affected ${pluralize(
            token,
          )} are listed above for brevity.`,
        ),
    )
    .paragraph(
      unchanged.length > 0 && summarizeUnchanged(token, { changed, unchanged }),
    );
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

function formatTitle({
  title,
  docsUrl,
}: {
  title: string;
  docsUrl?: string;
}): InlineText {
  if (docsUrl) {
    return md.link(docsUrl, title);
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
