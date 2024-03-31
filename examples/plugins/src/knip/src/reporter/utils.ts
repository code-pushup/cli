import type {
  Issue as KnipIssue,
  IssueSeverity as KnipSeverity,
  ReporterOptions,
} from 'knip/dist/types/issues';
import {
  AuditOutput,
  Issue as CodePushupIssue,
  IssueSeverity as CondPushupIssueSeverity,
} from '@code-pushup/models';
import {capital, singular, slugify} from '@code-pushup/utils';

export function getSource({
  filePath: file,
  col,
  line,
  symbols,
}: KnipIssue): CodePushupIssue['source'] {
  if (!file) {
    return undefined;
  }

  if (col !== undefined && line !== undefined) {
    return {
      file,
      position: {
        startLine: line,
        startColumn: col,
      },
    };
  } else if (
    symbols?.[0]?.col !== undefined &&
    symbols[0]?.line !== undefined
  ) {
    return {
      file,
      position: {
        startLine: symbols[0].line,
        startColumn: symbols[0].col,
      },
    };
  }

  return { file };
}

const severityMap: Record<KnipSeverity, CondPushupIssueSeverity> = {
  off: 'info',
  error: 'error',
  warn: 'warning',
} as const;

export function knipIssueToIssue(issue: KnipIssue) {
  const { type, filePath, symbol, severity = 'off' } = issue;
  return {
    message: `${capital(singular(type))} ${symbol}`,
    severity: severityMap[severity],
    ...(filePath ? { source: getSource(issue) } : {}),
  };
}

export function createAuditOutputFromKnipIssues(
  type: string,
  knipIssues: KnipIssue[],
): AuditOutput {
  const issues = knipIssues.map(knipIssueToIssue);
  return {
    slug: slugify(type),
    value: knipIssues.length,
    displayValue: `${knipIssues.length} ${
      knipIssues.length === 1 ? singular(type) : type
    }`,
    score: knipIssues.length > 0 ? 0 : 1,
    details: { issues },
  };
}

export function createAuditOutputFromKnipFiles(
  knipIssues: string[],
): AuditOutput {
  const issues = knipIssues.map(
    file =>
      ({
        message: `${capital(singular('files'))} ${file}`,
        severity: severityMap['error'],
        source: {
          file,
        },
      } satisfies CodePushupIssue),
  );
  return {
    slug: 'files',
    value: knipIssues.length,
    displayValue: `${knipIssues.length} ${
      knipIssues.length === 1 ? singular('files') : 'files'
    }`,
    score: knipIssues.length > 0 ? 0 : 1,
    details: { issues },
  };
}

export function knipToCpReport({ issues }: Pick<ReporterOptions, 'issues'>) {
  const { files, ...issueRecords } = issues;

  //  issues = devDependencies.<file>.<symbol>.{type: IssueType}
  return [
    createAuditOutputFromKnipFiles(Object.values(files) as string[]),

    // { devDependencies: { <file> : { <symbol> : { type: IssueType } } } }
    ...Object.entries(issueRecords)
      .filter(([key]) => key !== 'files')
      .map(([type, fileIssueRecords]) => {
        // { <file> { <symbol> : { type: IssueType } } }
        const symbolIssueRecords = Object.values(fileIssueRecords);
        // { <symbol> : { type: IssueType } }
        const issueArray = Object.values(symbolIssueRecords)
          //
          .flatMap(symbolIssues => Object.values(symbolIssues));
        return createAuditOutputFromKnipIssues(type, issueArray);
      }),
  ];
}
