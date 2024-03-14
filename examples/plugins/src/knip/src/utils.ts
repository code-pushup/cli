import type {
  IssueSet,
  IssueType,
  Issue as KnipIssue,
  IssueSeverity as KnipSeverity,
  ReporterOptions,
  SymbolType,
} from 'knip/dist/types/issues';
import {
  AuditOutput,
  Issue as CodePushupIssue,
  IssueSeverity as CondPushupIssueSeverity,
} from '@code-pushup/models';
import {
  findLineNumberInText,
  readJsonFile,
  slugify,
} from '@code-pushup/utils';

export function getSource({
  filePath: file,
  col,
  line,
  symbols,
  type,
  symbol,
}: KnipIssue): CodePushupIssue['source'] {
  if (!file) {
    return undefined;
  }

  if (col && line) {
    return {
      file,
      position: {
        startLine: line,
        startColumn: col,
      },
    };
  } else if (symbols?.[0]?.col && symbols[0]?.line) {
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

const processIssue = (issue: KnipIssue) => {
  return {
    message: `${capital(singularType(issue.type))} ${issue.symbol} unused`,
    severity: severityMap[issue.severity as KnipSeverity] || 'info',
    ...(issue.filePath ? { source: getSource(issue) } : {}),
  };
};

const severityMap: Record<KnipSeverity, CondPushupIssueSeverity> = {
  off: 'info',
  error: 'error',
  warn: 'warning',
};

export function capital(str: string): string {
  return str.at(0)?.toUpperCase() + str.slice(1);
}

export function singularType(typeInPlural: string): string {
  if (typeInPlural.endsWith('ies')) {
    return `${typeInPlural.slice(0, -3)}y`;
  }
  if (typeInPlural.endsWith('s')) {
    return typeInPlural.slice(0, -1);
  }
  return typeInPlural;
}

export function createAuditOutputFromKnipIssues(
  type: string,
  knipIssues: KnipIssue[],
): AuditOutput {
  const issues = knipIssues.map(processIssue);
  // const type = knipIssues.at(0)?.type ?? '';
  return {
    slug: slugify(type),
    value: knipIssues.length,
    displayValue: `${knipIssues.length} ${
      knipIssues.length === 1 ? singularType(type) : type
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
        message: `${capital(singularType('files'))} ${file} unused`,
        severity: severityMap.error,
        source: {
          file,
        },
      } satisfies CodePushupIssue),
  );
  // const type = knipIssues.at(0)?.type ?? '';
  return {
    slug: 'files',
    value: knipIssues.length,
    displayValue: `${knipIssues.length} ${
      knipIssues.length === 1 ? singularType('files') : 'files'
    }`,
    score: knipIssues.length > 0 ? 0 : 1,
    details: { issues },
  };
}

export function knipToCpReport({ issues }: Pick<ReporterOptions, 'issues'>) {
  const { files, ...issueRecords } = issues;

  //  issues = devDependencies.<file>.<symbol>.{type: IssueType}
  return [
    createAuditOutputFromKnipFiles(Array.from(files)),

    // { devDependencies: { <file> : { <symbol> : { type: IssueType } } } }
    ...Object.entries(issueRecords)
      .filter(([key]) => key !== 'files')
      .map(([type, fileIssueRecords]) => {
        // { <file> : { <symbol> : { type: IssueType } } }
        const symbolIssueRecords = Object.values(fileIssueRecords);
        // { <symbol> : { type: IssueType } }
        const issueArray = Object.values(symbolIssueRecords)
          //
          .flatMap(symbolIssues => Object.values(symbolIssues));
        return createAuditOutputFromKnipIssues(type, issueArray);
      }),
  ];
}
