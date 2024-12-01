import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  type Format,
  type PersistConfig,
  type Report,
  type ReportsDiff,
  type UploadConfig,
  reportSchema,
} from '@code-pushup/models';
import {
  type Diff,
  calcDuration,
  ensureDirectoryExists,
  generateMdReportsDiff,
  readJsonFile,
  scoreReport,
  ui,
} from '@code-pushup/utils';
import packageJson from '../../package.json' with { type: 'json' };
import {
  type ReportsToCompare,
  compareAudits,
  compareCategories,
  compareGroups,
} from './implementation/compare-scorables.js';
import { loadPortalClient } from './load-portal-client.js';

export async function compareReportFiles(
  inputPaths: Diff<string>,
  persistConfig: Required<PersistConfig>,
  uploadConfig: UploadConfig | undefined,
  label?: string,
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

  const diff = compareReports(reports);
  if (label) {
    // eslint-disable-next-line functional/immutable-data
    diff.label = label;
  }
  if (uploadConfig && diff.commits) {
    // eslint-disable-next-line functional/immutable-data
    diff.portalUrl = await fetchPortalComparisonLink(
      uploadConfig,
      diff.commits,
    );
  }

  return Promise.all(
    format.map(async fmt => {
      const outputPath = join(outputDir, `${filename}-diff.${fmt}`);
      const content = reportsDiffToFileContent(diff, fmt);
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
    packageName: packageJson.name,
    version: packageJson.version,
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

async function fetchPortalComparisonLink(
  uploadConfig: UploadConfig,
  commits: NonNullable<ReportsDiff['commits']>,
): Promise<string | undefined> {
  const { server, apiKey, organization, project } = uploadConfig;
  const portalClient = await loadPortalClient();
  if (!portalClient) {
    return;
  }
  const { PortalOperationError, getPortalComparisonLink } = portalClient;
  try {
    return await getPortalComparisonLink({
      server,
      apiKey,
      parameters: {
        organization,
        project,
        before: commits.before.hash,
        after: commits.after.hash,
      },
    });
  } catch (error) {
    if (error instanceof PortalOperationError) {
      ui().logger.warning(
        `Failed to fetch portal comparison link - ${error.message}`,
      );
      return undefined;
    }
    throw error;
  }
}
