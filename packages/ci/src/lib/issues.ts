import type {
  Audit,
  AuditReport,
  Issue,
  PluginMeta,
  Report,
  ReportsDiff,
} from '@code-pushup/models';
import {
  type ChangedFiles,
  adjustFileName,
  adjustLine,
  isFileChanged,
} from './git';

export type SourceFileIssue = Required<Issue> & IssueContext;

type IssueContext = {
  audit: Pick<Audit, 'slug' | 'title'>;
  plugin: Pick<PluginMeta, 'slug' | 'title'>;
};

type IssueCompareFn = (a: SourceFileIssue, b: SourceFileIssue) => number;

export function filterRelevantIssues({
  currReport,
  prevReport,
  reportsDiff,
  changedFiles,
}: {
  currReport: Report;
  prevReport: Report;
  reportsDiff: ReportsDiff;
  changedFiles: ChangedFiles;
}): SourceFileIssue[] {
  const auditsWithPlugin = [
    ...reportsDiff.audits.changed,
    ...reportsDiff.audits.added,
  ]
    .map((auditLink): [PluginMeta, AuditReport] | undefined => {
      const plugin = currReport.plugins.find(
        ({ slug }) => slug === auditLink.plugin.slug,
      );
      const audit = plugin?.audits.find(({ slug }) => slug === auditLink.slug);
      return plugin && audit && [plugin, audit];
    })
    .filter((ctx): ctx is [PluginMeta, AuditReport] => ctx != null);

  const issues = auditsWithPlugin.flatMap(([plugin, audit]) =>
    getAuditIssues(audit, plugin),
  );
  const prevIssues = prevReport.plugins.flatMap(plugin =>
    plugin.audits.flatMap(audit => getAuditIssues(audit, plugin)),
  );

  return issues
    .filter(
      issue =>
        isFileChanged(changedFiles, issue.source.file) &&
        !prevIssues.some(prevIssue =>
          issuesMatch(prevIssue, issue, changedFiles),
        ),
    )
    .sort(createIssuesSortCompareFn(currReport));
}

function getAuditIssues(
  audit: AuditReport,
  plugin: PluginMeta,
): SourceFileIssue[] {
  return (
    audit.details?.issues
      ?.filter((issue): issue is Required<Issue> => issue.source?.file != null)
      .map(issue => ({ ...issue, audit, plugin })) ?? []
  );
}

export function issuesMatch(
  prev: SourceFileIssue,
  curr: SourceFileIssue,
  changedFiles: ChangedFiles,
): boolean {
  return (
    prev.plugin.slug === curr.plugin.slug &&
    prev.audit.slug === curr.audit.slug &&
    prev.severity === curr.severity &&
    removeDigits(prev.message) === removeDigits(curr.message) &&
    adjustFileName(changedFiles, prev.source.file) === curr.source.file &&
    positionsMatch(prev.source, curr.source, changedFiles)
  );
}

function removeDigits(message: string): string {
  return message.replace(/\d+/g, '');
}

function positionsMatch(
  prev: SourceFileIssue['source'],
  curr: SourceFileIssue['source'],
  changedFiles: ChangedFiles,
): boolean {
  if (!hasPosition(prev) || !hasPosition(curr)) {
    return hasPosition(prev) === hasPosition(curr);
  }
  return (
    adjustedStartLinesMatch(prev, curr, changedFiles) ||
    adjustedLineSpansMatch(prev, curr, changedFiles)
  );
}

function hasPosition(
  source: SourceFileIssue['source'],
): source is Required<SourceFileIssue['source']> {
  return source.position != null;
}

function adjustedStartLinesMatch(
  prev: Required<SourceFileIssue['source']>,
  curr: Required<SourceFileIssue['source']>,
  changedFiles: ChangedFiles,
): boolean {
  return (
    adjustLine(changedFiles, prev.file, prev.position.startLine) ===
    curr.position.startLine
  );
}

function adjustedLineSpansMatch(
  prev: SourceFileIssue['source'],
  curr: SourceFileIssue['source'],
  changedFiles: ChangedFiles,
): boolean {
  if (prev.position?.endLine == null || curr.position?.endLine == null) {
    return false;
  }

  const prevLineCount = prev.position.endLine - prev.position.startLine;
  const currLineCount = curr.position.endLine - curr.position.startLine;
  const currStartLineOffset =
    adjustLine(changedFiles, curr.file, curr.position.startLine) -
    curr.position.startLine;
  return prevLineCount === currLineCount - currStartLineOffset;
}

function createIssuesSortCompareFn(report: Report): IssueCompareFn {
  return (a, b) =>
    getAuditImpactValue(b, report) - getAuditImpactValue(a, report);
}

export function getAuditImpactValue(
  { audit, plugin }: IssueContext,
  report: Report,
): number {
  return report.categories
    .map((category): number => {
      const weights = category.refs.map((ref): number => {
        if (ref.plugin !== plugin.slug) {
          return 0;
        }

        switch (ref.type) {
          case 'audit':
            return ref.slug === audit.slug ? ref.weight : 0;

          case 'group':
            const group = report.plugins
              .find(({ slug }) => slug === ref.plugin)
              ?.groups?.find(({ slug }) => slug === ref.slug);
            if (!group?.refs.length) {
              return 0;
            }
            const groupRatio =
              (group.refs.find(({ slug }) => slug === audit.slug)?.weight ??
                0) / group.refs.reduce((acc, { weight }) => acc + weight, 0);
            return ref.weight * groupRatio;
        }
      });

      return (
        weights.reduce((acc, weight) => acc + weight, 0) /
        category.refs.reduce((acc, { weight }) => acc + weight, 0)
      );
    })
    .reduce((acc, value) => acc + value, 0);
}
