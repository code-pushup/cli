import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import {
  type Format,
  type PersistConfig,
  type Report,
  type ReportsDiff,
  type UploadConfig,
  reportSchema,
  validate,
} from '@code-pushup/models';
import {
  type Diff,
  calcDuration,
  createReportPath,
  ensureDirectoryExists,
  generateMdReportsDiff,
  readJsonFile,
  scoreReport,
  ui,
} from '@code-pushup/utils';
import {
  type ReportsToCompare,
  compareAudits,
  compareCategories,
  compareGroups,
} from './implementation/compare-scorables.js';
import { loadPortalClient } from './load-portal-client.js';

export type CompareOptions = {
  before?: string;
  after?: string;
  label?: string;
};

export async function compareReportFiles(
  config: {
    persist: Required<PersistConfig>;
    upload?: UploadConfig;
  },
  options?: CompareOptions,
): Promise<string[]> {
  const { outputDir, filename, format } = config.persist;

  const defaultInputPath = (suffix: keyof Diff<string>) =>
    createReportPath({ outputDir, filename, format: 'json', suffix });

  const [reportBefore, reportAfter] = await Promise.all([
    readJsonFile(options?.before ?? defaultInputPath('before')),
    readJsonFile(options?.after ?? defaultInputPath('after')),
  ]);
  const reports: Diff<Report> = {
    before: validate(reportSchema, reportBefore),
    after: validate(reportSchema, reportAfter),
  };

  const diff = compareReports(reports);

  const label = options?.label ?? getLabelFromReports(reports);
  const portalUrl =
    config.upload &&
    diff.commits &&
    (await fetchPortalComparisonLink(config.upload, diff.commits));

  const diffWithLinks: ReportsDiff =
    label || portalUrl
      ? { ...diff, ...(label && { label }), ...(portalUrl && { portalUrl }) }
      : diff;

  return Promise.all(
    format.map(async fmt => {
      const outputPath = createReportPath({
        outputDir,
        filename,
        format: fmt,
        suffix: 'diff',
      });
      const content = reportsDiffToFileContent(diffWithLinks, fmt);
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

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

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

function getLabelFromReports(reports: Diff<Report>): string | undefined {
  if (
    reports.before.label &&
    reports.after.label &&
    reports.before.label === reports.after.label
  ) {
    return reports.after.label;
  }
  return undefined;
}
