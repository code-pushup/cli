import type {Issue, IssueRecords, ReporterOptions} from 'knip/dist/types/issues';
import type {Entries} from 'type-fest';
import {writeFile} from "node:fs/promises";
import {join} from "node:path";
import {createAuditOutputFromKnipIssues} from "./dist/examples/plugins";

/**
 * @example
 *
 * npx knip --reporter ./code-pushup.reporter.ts --reporter-options '{"outputDir":"tmp"}'
 *
 */
export default async ({ report, issues, options }: ReporterOptions ) => {

  const {outputFile = join('.code-pushup', `knip-report.json`)} = options ? JSON.parse(options) : {};
  const result = (Object.entries(issues) as Entries<ReporterOptions['issues']>)
    .filter(([_, isReported]) => isReported)
    .map(([type]) => {
      const issueRecords: IssueRecords = issues[type] as IssueRecords;
      const issueArray: Issue[] = Object.values(issueRecords).flat().map(issue => ({ ...issue, type } as Issue));
      return createAuditOutputFromKnipIssues(type, issueArray);
    });

  await writeFile(outputFile, JSON.stringify(result, null, 2));
 // console.log(`Created report: ${outputFile} \n ${JSON.stringify(result)}`);
};


