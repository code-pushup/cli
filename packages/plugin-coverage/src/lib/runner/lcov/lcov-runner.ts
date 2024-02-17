import { join } from 'node:path';
import type { LCOVRecord } from 'parse-lcov';
import { AuditOutputs } from '@code-pushup/models';
import { exists, readTextFile, toUnixNewlines } from '@code-pushup/utils';
import { CoverageResult, CoverageType } from '../../config';
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
 * @param results Paths to LCOV results
 * @param coverageTypes types of coverage to be considered
 * @returns Audit outputs with complete coverage data.
 */
export async function lcovResultsToAuditOutputs(
  results: CoverageResult[],
  coverageTypes: CoverageType[],
): Promise<AuditOutputs> {
  // Parse lcov files
  const lcovResults = await parseLcovFiles(results);

  // Calculate code coverage from all coverage results
  const totalCoverageStats = getTotalCoverageFromLcovRecords(
    lcovResults,
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
 * @param results Paths to LCOV results
 * @returns Array of parsed LCOVRecords.
 */
async function parseLcovFiles(
  results: CoverageResult[],
): Promise<LCOVRecord[]> {
  const parsedResults = await Promise.all(
    results.map(async result => {
      const resultsPath =
        typeof result === 'string' ? result : result.resultsPath;
      const lcovFileContent = await readTextFile(resultsPath);
      const parsedRecords = parseLcov(toUnixNewlines(lcovFileContent));
      return parsedRecords.map<LCOVRecord>(record => ({
        ...record,
        file:
          typeof result === 'string' || result.pathToProject == null
            ? record.file
            : join(result.pathToProject, record.file),
      }));
    }),
  );
  if (parsedResults.length !== results.length) {
    throw new Error('Some provided LCOV results were not valid.');
  }

  const flatResults = parsedResults.flat();

  if (flatResults.length === 0) {
    throw new Error('All provided results are empty.');
  }

  return flatResults;
}

/**
 *
 * @param records This function aggregates coverage stats from all coverage files
 * @param coverageTypes Types of coverage to be gathered
 * @returns Complete coverage stats for all defined types of coverage.
 */
function getTotalCoverageFromLcovRecords(
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
