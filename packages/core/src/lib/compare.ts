import { writeFile } from 'node:fs/promises';
import { Report, ReportsDiff, reportSchema } from '@code-pushup/models';
import {
  Diff,
  calcDuration,
  readJsonFile,
  scoreReport,
} from '@code-pushup/utils';
import { name as packageName, version } from '../../package.json';
import {
  ReportsToCompare,
  compareAudits,
  compareCategories,
  compareGroups,
} from './implementation/compare-scorables';

export async function compareReportFiles(
  inputPaths: Diff<string>,
  outputPath: string,
): Promise<void> {
  const [reportBefore, reportAfter] = await Promise.all([
    readJsonFile(inputPaths.before),
    readJsonFile(inputPaths.after),
  ]);
  const reports: Diff<Report> = {
    before: reportSchema.parse(reportBefore),
    after: reportSchema.parse(reportAfter),
  };

  const reportsDiff = compareReports(reports);

  await writeFile(outputPath, JSON.stringify(reportsDiff, null, 2));
}

export function compareReports(reports: Diff<Report>): ReportsDiff {
  const start = performance.now();
  const date = new Date().toISOString();

  const commits: ReportsDiff['commits'] =
    reports.before.commit != null && reports.after.commit != null
      ? { before: reports.before.commit, after: reports.after.commit }
      : null;

  const scoredReports: ReportsToCompare = {
    before: scoreReport(reports.before),
    after: scoreReport(reports.after),
  };

  const categories = compareCategories(scoredReports);
  const groups = compareGroups(scoredReports);
  const audits = compareAudits(scoredReports);

  const duration = calcDuration(start);

  return {
    commits,
    categories,
    groups,
    audits,
    packageName,
    version,
    date,
    duration,
  };
}
