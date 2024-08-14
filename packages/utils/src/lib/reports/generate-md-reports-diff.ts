import {
  type HeadingLevel,
  InlineText,
  MarkdownDocument,
  TableColumnObject,
  TableRow,
  md,
} from 'build-md';
import { ReportsDiff } from '@code-pushup/models';
import { pluralize, pluralizeToken } from '../formatting';
import { HIERARCHY } from '../text-formats';
import { objectToEntries, toArray } from '../transform';
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

  return new MarkdownDocument()
    .heading(HIERARCHY.level_2, !skipHeading && '🏷️ Categories')
    .table(
      hasChanges ? columns : columns.slice(0, 2),
      rows.map(row => (hasChanges ? row : row.slice(0, 2))),
    )
    .paragraph(added.length > 0 && md.italic('(\\*) New category.'))
    .paragraph(
      skipUnchanged &&
        unchanged.length > 0 &&
        summarizeUnchanged('category', { changed, unchanged }),
    );
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
  token: string,
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

function formatPortalLink(portalUrl: string | undefined) {
  return (
    portalUrl &&
    md.link(portalUrl, '🕵️ See full comparison in Code PushUp portal 🔍')
  );
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

function getDiffChanges(diff: ReportsDiff): Change[] {
  return [
    ...diff.categories.changed,
    ...diff.groups.changed,
    ...diff.audits.changed,
  ];
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
