import {
  type HeadingLevel,
  MarkdownDocument,
  type TableColumnObject,
  type TableRow,
  md,
} from 'build-md';
import type { ReportsDiff } from '@code-pushup/models';
import { HIERARCHY } from '../text-formats';
import { toArray } from '../transform';
import type { WithRequired } from '../types';
import {
  changesToDiffOutcomes,
  compareDiffsBy,
  createGroupsOrAuditsDetails,
  formatPortalLink,
  formatReportOutcome,
  formatTitle,
  getDiffChanges,
  mergeDiffOutcomes,
  sortChanges,
  summarizeDiffOutcomes,
  summarizeUnchanged,
} from './generate-md-reports-diff-utils';
import type { DiffOutcome } from './types';
import {
  formatScoreChange,
  formatScoreWithColor,
  formatValueChange,
  scoreMarker,
} from './utils';

export function generateMdReportsDiff(diff: ReportsDiff): string {
  return new MarkdownDocument()
    .$concat(
      createDiffHeaderSection(diff),
      createDiffCategoriesSection(diff),
      createDiffDetailsSection(diff),
    )
    .toString();
}

export type LabeledDiff = WithRequired<ReportsDiff, 'label'>;

export function generateMdReportsDiffForMonorepo(diffs: LabeledDiff[]): string {
  const diffsWithOutcomes = diffs
    .map(diff => ({
      ...diff,
      outcome: mergeDiffOutcomes(changesToDiffOutcomes(getDiffChanges(diff))),
    }))
    .sort(
      (a, b) =>
        compareDiffsBy('categories', a, b) ||
        compareDiffsBy('groups', a, b) ||
        compareDiffsBy('audits', a, b) ||
        a.label.localeCompare(b.label),
    );
  const unchanged = diffsWithOutcomes.filter(
    ({ outcome }) => outcome === 'unchanged',
  );
  const changed = diffsWithOutcomes.filter(diff => !unchanged.includes(diff));

  return new MarkdownDocument()
    .$concat(
      createDiffHeaderSection(diffs),
      ...changed.map(createDiffProjectSection),
    )
    .$if(unchanged.length > 0, doc =>
      doc
        .rule()
        .paragraph(summarizeUnchanged('project', { unchanged, changed })),
    )
    .toString();
}

function createDiffHeaderSection(
  diff: ReportsDiff | ReportsDiff[],
): MarkdownDocument {
  const outcome = mergeDiffOutcomes(
    changesToDiffOutcomes(toArray(diff).flatMap(getDiffChanges)),
  );
  // TODO: what if array contains different commit pairs?
  const commits = Array.isArray(diff) ? diff[0]?.commits : diff.commits;
  const portalUrl = Array.isArray(diff) ? undefined : diff.portalUrl;

  return new MarkdownDocument()
    .heading(HIERARCHY.level_1, 'Code PushUp')
    .paragraph(formatReportOutcome(outcome, commits))
    .paragraph(formatPortalLink(portalUrl));
}

function createDiffProjectSection(
  diff: LabeledDiff & { outcome: DiffOutcome },
): MarkdownDocument {
  return new MarkdownDocument()
    .heading(HIERARCHY.level_2, md`💼 Project ${md.code(diff.label)}`)
    .paragraph(formatReportOutcome(diff.outcome))
    .paragraph(formatPortalLink(diff.portalUrl))
    .$concat(
      createDiffCategoriesSection(diff, {
        skipHeading: true,
        skipUnchanged: true,
      }),
      createDiffDetailsSection(diff, HIERARCHY.level_3),
    );
}

function createDiffCategoriesSection(
  diff: ReportsDiff,
  options?: { skipHeading?: boolean; skipUnchanged?: boolean },
): MarkdownDocument | null {
  const { changed, unchanged, added } = diff.categories;
  const { skipHeading, skipUnchanged } = options ?? {};

  const categoriesCount = changed.length + unchanged.length + added.length;
  const hasChanges = unchanged.length < categoriesCount;

  if (categoriesCount === 0) {
    return null;
  }

  const [columns, rows] = createCategoriesTable(diff, {
    hasChanges,
    skipUnchanged,
  });

  return new MarkdownDocument()
    .heading(HIERARCHY.level_2, !skipHeading && '🏷️ Categories')
    .table(columns, rows)
    .paragraph(added.length > 0 && md.italic('(\\*) New category.'))
    .paragraph(
      skipUnchanged &&
        unchanged.length > 0 &&
        summarizeUnchanged('category', { changed, unchanged }),
    );
}

function createCategoriesTable(
  diff: ReportsDiff,
  options: { hasChanges: boolean; skipUnchanged?: boolean },
): Parameters<MarkdownDocument['table']> {
  const { changed, unchanged, added } = diff.categories;
  const { hasChanges, skipUnchanged } = options;

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
    ...(skipUnchanged
      ? []
      : unchanged.map(category => [
          formatTitle(category),
          formatScoreWithColor(category.score, { skipBold: true }),
          formatScoreWithColor(category.score),
          '–',
        ])),
  ];

  return [
    hasChanges ? columns : columns.slice(0, 2),
    rows.map(row => (hasChanges ? row : row.slice(0, 2))),
  ];
}

function createDiffDetailsSection(
  diff: ReportsDiff,
  level: HeadingLevel = HIERARCHY.level_2,
): MarkdownDocument | null {
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
    createDiffGroupsSection(diff, level),
    createDiffAuditsSection(diff, level),
  );
  return new MarkdownDocument().details(summary, details);
}

function createDiffGroupsSection(
  diff: ReportsDiff,
  level: HeadingLevel,
): MarkdownDocument | null {
  if (diff.groups.changed.length + diff.groups.unchanged.length === 0) {
    return null;
  }
  return new MarkdownDocument().heading(level, '🗃️ Groups').$concat(
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

function createDiffAuditsSection(
  diff: ReportsDiff,
  level: HeadingLevel,
): MarkdownDocument {
  return new MarkdownDocument().heading(level, '🛡️ Audits').$concat(
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
