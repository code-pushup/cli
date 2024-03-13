import type { ReporterOptions, Issue, IssueRecords } from 'knip/dist/types/issues';
import type { Entries } from 'type-fest';
import {slugify} from "./dist/packages/utils";
import {writeFile} from "node:fs/promises";
import {join} from "node:path";

const processIssue = (issue: Issue) => ({
  message: `${issue.type} ${issue.symbol || 'File unused'}`,
  severity: 'warning',
  ...(issue.filePath || issue.line || issue.col ? {
    source: {
      ...(issue.filePath ? { file: issue.filePath } : { file: '???' }),
      ...(issue.line && issue.col ? { position: {
          startLine: issue.line,
          startColumn: issue.col,
        }} : {}),
    },
  } : {}),
});

const createAuditOutput = (type: string, issues: Issue[]) => ({
  slug: slugify(type),
  value: issues.length,
  displayValue: `${issues.length} ${type}`,
  score: issues.length > 0 ? 0 : 1,
  details: { issues: issues.map(processIssue) },
});


/**
 * @example
 *
 * npx knip --reporter ./code-pushup.reporter.ts --reporter-options '{"outputDir":"tmp"}'
 *
 */
export default ({ report, issues, options }: ReporterOptions ) => {
  const {outputDir} = options ? JSON.parse(options) : {outputDir: '.code-pushup'};
  const result = (Object.entries(report) as Entries<ReporterOptions['report']>)
    .filter(([_, isReported]) => isReported)
    .map(([type]) => {
      const issueRecords: IssueRecords = issues[type] as IssueRecords;
      const issueArray: Issue[] = Object.values(issueRecords).flat().map(issue => ({ ...issue, type } as Issue));
      return createAuditOutput(type, issueArray);
    });
  const path = join(outputDir, `knip-report-${Date.now()}.json`);
  writeFile(path, JSON.stringify(result, null, 2));
  console.log(`Created report: ${path}`);
};


