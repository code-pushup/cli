import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  type Format,
  type PersistConfig,
  Report,
  ReportsDiff,
  reportSchema,
} from '@code-pushup/models';
import {
  Diff,
  calcDuration,
  ensureDirectoryExists,
  generateMdReportsDiff,
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
  persistConfig: Required<PersistConfig>,
): Promise<string[]> {
  const { outputDir, filename, format } = persistConfig;

  const [reportBefore, reportAfter] = await Promise.all([
    readJsonFile(inputPaths.before),
    readJsonFile(inputPaths.after),
  ]);
  const reports: Diff<Report> = {
    before: reportSchema.parse(reportBefore),
    after: reportSchema.parse(reportAfter),
  };

  const reportsDiff = compareReports(reports);

  return Promise.all(
    format.map(async fmt => {
      const outputPath = join(outputDir, `${filename}-diff.${fmt}`);
      const content = reportsDiffToFileContent(reportsDiff, fmt);
      await ensureDirectoryExists(outputDir);
      await writeFile(outputPath, content);
      return outputPath;
    }),
  );
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

function reportsDiffToFileContent(
  reportsDiff: ReportsDiff,
  format: Format,
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(reportsDiff, null, 2);
    case 'md':
      return generateMdReportsDiff(reportsDiff);
  }
}
