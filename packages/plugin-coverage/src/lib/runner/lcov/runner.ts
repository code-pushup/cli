import { join } from 'node:path';
import type { LCOVRecord } from 'parse-lcov';
import { AuditOutputs } from '@code-pushup/models';
import { exists, readTextFile } from '@code-pushup/utils';
import { CoverageReport, CoverageType } from '../../config';
import { parseLcov } from './parse-lcov';
import {
  lcovCoverageToAuditOutput,
  recordToStatFunctionMapper,
} from './transform';
import { LCOVStat, LCOVStats } from './types';

// Note: condition or statement coverage is not supported in LCOV
// https://stackoverflow.com/questions/48260434/is-it-possible-to-check-condition-coverage-with-gcov

/**
 *
 * @param reports report files
 * @param coverageTypes types of coverage to be considered
 * @returns Audit outputs with complete coverage data.
 */
export async function lcovResultsToAuditOutputs(
  reports: CoverageReport[],
  coverageTypes: CoverageType[],
): Promise<AuditOutputs> {
  const parsedReports = await Promise.all(
    reports.map(async report => {
      const reportContent = await readTextFile(report.resultsPath);
      const parsedRecords = parseLcov(reportContent);
      return parsedRecords.map<LCOVRecord>(record => ({
        ...record,
        file:
          report.pathToProject == null
            ? record.file
            : join(report.pathToProject, record.file),
      }));
    }),
  );

  if (parsedReports.length !== reports.length) {
    throw new Error('Some provided LCOV reports were not valid.');
  }

  const flatReports = parsedReports.flat();

  if (flatReports.length === 0) {
    throw new Error('All provided reports are empty.');
  }

  // Accumulate code coverage from all coverage result files
  const totalCoverageStats = getTotalCoverageFromLcovReports(
    flatReports,
    coverageTypes,
  );

  return coverageTypes
    .map(coverageType => {
      const stats = totalCoverageStats[coverageType];
      if (!stats) {
        return null;
      }
      return lcovCoverageToAuditOutput(stats, coverageType);
    })
    .filter(exists);
}

/**
 *
 * @param records This function aggregates coverage stats from all coverage files
 * @param coverageTypes Types of coverage to be gathered
 * @returns Complete coverage stats for all defined types of coverage.
 */
function getTotalCoverageFromLcovReports(
  records: LCOVRecord[],
  coverageTypes: CoverageType[],
): LCOVStats {
  return records.reduce<LCOVStats>(
    (acc, report) =>
      Object.fromEntries([
        ...Object.entries(acc),
        ...(
          Object.entries(
            getCoverageStatsFromLcovRecord(report, coverageTypes),
          ) as [CoverageType, LCOVStat][]
        ).map(([type, stats]): [CoverageType, LCOVStat] => [
          type,
          {
            totalFound: (acc[type]?.totalFound ?? 0) + stats.totalFound,
            totalHit: (acc[type]?.totalHit ?? 0) + stats.totalHit,
            issues: [...(acc[type]?.issues ?? []), ...stats.issues],
          },
        ]),
      ]),
    {},
  );
}

/**
 * @param record record file data
 * @param coverageTypes types of coverage to be gathered
 * @returns Relevant coverage data from one lcov record file.
 */
function getCoverageStatsFromLcovRecord(
  record: LCOVRecord,
  coverageTypes: CoverageType[],
): LCOVStats {
  return Object.fromEntries(
    coverageTypes.map((coverageType): [CoverageType, LCOVStat] => [
      coverageType,
      recordToStatFunctionMapper[coverageType](record),
    ]),
  );
}
