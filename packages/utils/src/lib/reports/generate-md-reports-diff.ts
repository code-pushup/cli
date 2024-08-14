import {
  HeadingLevel,
  MarkdownDocument,
  TableColumnObject,
  TableRow,
  md,
} from 'build-md';
import { ReportsDiff } from '@code-pushup/models';
import { HIERARCHY } from '../text-formats';
import { toArray } from '../transform';
import {
  changesToDiffOutcomes,
  createGroupsOrAuditsDetails,
  formatPortalLink,
  formatTitle,
  getDiffChanges,
  mergeDiffOutcomes,
  sortChanges,
  summarizeDiffOutcomes,
  summarizeUnchanged,
} from './generate-md-reports-diff-utils';
import { DiffOutcome } from './types';
import {
  formatScoreChange,
  formatScoreWithColor,
  formatValueChange,
  scoreMarker,
} from './utils';

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

export type ProjectDiff = {
  name: string;
  portalUrl?: string;
  diff: ReportsDiff;
};

export type ProjectDiffWithOutcome = ProjectDiff & {
  outcome: DiffOutcome;
};

export function generateMdReportsDiffForMonorepo(
  projects: ProjectDiff[],
): string {
  // TODO: sort projects (most changed, alphabetical)
  const projectsWithOutcomes = projects.map(
    (project): ProjectDiffWithOutcome => ({
      ...project,
      outcome: mergeDiffOutcomes(
        changesToDiffOutcomes(getDiffChanges(project.diff)),
      ),
    }),
  );
  const unchanged = projectsWithOutcomes.filter(
    ({ outcome }) => outcome === 'unchanged',
  );
  const changed = projectsWithOutcomes.filter(
    project => !unchanged.includes(project),
  );

  return new MarkdownDocument()
    .$concat(
      createDiffHeaderSection(projects.map(({ diff }) => diff)),
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
  portalUrl?: string,
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
    changesToDiffOutcomes(toArray(diff).flatMap(getDiffChanges)),
  );

  const commits = Array.isArray(diff) ? diff[0]?.commits : diff.commits; // TODO: what if array contains different commit pairs?
  const commitsText =
    commits &&
    `compared target commit ${commits.after.hash} with source commit ${commits.before.hash}`;

  return new MarkdownDocument()
    .heading(HIERARCHY.level_1, 'Code PushUp')
    .paragraph(
      commitsText
        ? md`${outcomeTexts[outcome]} – ${commitsText}.`
        : outcomeTexts[outcome],
    )
    .paragraph(formatPortalLink(portalUrl));
}

function createDiffProjectSection(
  project: ProjectDiffWithOutcome,
): MarkdownDocument {
  const outcomeTexts = {
    positive: 'improved 🥳',
    negative: 'regressed 😟',
    mixed: 'mixed 🤨',
    unchanged: 'unchanged 😐',
  };
  const outcomeText = outcomeTexts[project.outcome];

  return new MarkdownDocument()
    .heading(
      HIERARCHY.level_2,
      md`💼 Project ${md.code(project.name)} – ${outcomeText}`,
    )
    .paragraph(formatPortalLink(project.portalUrl))
    .$concat(
      createDiffCategoriesSection(project.diff, {
        skipHeading: true,
        skipUnchanged: true,
      }),
      createDiffDetailsSection(project.diff, HIERARCHY.level_3),
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
