import { InlineText, MarkdownDocument, md } from 'build-md';
import { ReportsDiff } from '@code-pushup/models';
import { pluralize, pluralizeToken } from '../formatting';
import { objectToEntries } from '../transform';
import { DiffOutcome } from './types';

// to prevent exceeding Markdown comment character limit
const MAX_ROWS = 100;

export function summarizeUnchanged(
  token: string,
  { changed, unchanged }: { changed: unknown[]; unchanged: unknown[] },
): string {
  const pluralizedCount =
    changed.length > 0
      ? pluralizeToken(`other ${token}`, unchanged.length)
      : `All of ${pluralizeToken(token, unchanged.length)}`;
  const pluralizedVerb = unchanged.length === 1 ? 'is' : 'are';
  return `${pluralizedCount} ${pluralizedVerb} unchanged.`;
}

export function summarizeDiffOutcomes(
  outcomes: DiffOutcome[],
  token: string,
): string {
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

export function createGroupsOrAuditsDetails<T extends 'group' | 'audit'>(
  token: T,
  { changed, unchanged }: ReportsDiff[`${T}s`],
  ...[columns, rows]: Parameters<MarkdownDocument['table']>
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

export function formatTitle({
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

export function formatPortalLink(
  portalUrl: string | undefined,
): InlineText | undefined {
  return (
    portalUrl &&
    md.link(portalUrl, '🕵️ See full comparison in Code PushUp portal 🔍')
  );
}

type Change = {
  scores: { diff: number };
  values?: { diff: number };
};

export function sortChanges<T extends Change>(changes: T[]): T[] {
  return [...changes].sort(
    (a, b) =>
      Math.abs(b.scores.diff) - Math.abs(a.scores.diff) ||
      Math.abs(b.values?.diff ?? 0) - Math.abs(a.values?.diff ?? 0),
  );
}

export function getDiffChanges(diff: ReportsDiff): Change[] {
  return [
    ...diff.categories.changed,
    ...diff.groups.changed,
    ...diff.audits.changed,
  ];
}

export function changesToDiffOutcomes(changes: Change[]): DiffOutcome[] {
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

export function mergeDiffOutcomes(outcomes: DiffOutcome[]): DiffOutcome {
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

export function compareDiffsBy<T extends 'categories' | 'groups' | 'audits'>(
  type: T,
  a: ReportsDiff,
  b: ReportsDiff,
): number {
  return (
    sumScoreChanges(b[type].changed) - sumScoreChanges(a[type].changed) ||
    sumConfigChanges(b[type]) - sumConfigChanges(a[type])
  );
}

function sumScoreChanges(changes: Change[]): number {
  return changes.reduce<number>(
    (acc, { scores }) => acc + Math.abs(scores.diff),
    0,
  );
}

function sumConfigChanges({
  added,
  removed,
}: {
  added: unknown[];
  removed: unknown[];
}): number {
  return added.length + removed.length;
}
