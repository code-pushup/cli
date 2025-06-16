import path from 'node:path';
import type { LCOVRecord } from 'parse-lcov';
import type { AuditOutputs } from '@code-pushup/models';
import {
  type FileCoverage,
  exists,
  getGitRoot,
  objectFromEntries,
  objectToEntries,
  readTextFile,
  toUnixNewlines,
  ui,
} from '@code-pushup/utils';
import type { CoverageResult, CoverageType } from '../../config.js';
import { mergeLcovResults } from './merge-lcov.js';
import { parseLcov } from './parse-lcov.js';
import {
  lcovCoverageToAuditOutput,
  recordToStatFunctionMapper,
} from './transform.js';

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

  // Merge multiple coverage reports for the same file
  const mergedResults = mergeLcovResults(lcovResults);

  // Calculate code coverage from all coverage results
  const totalCoverageStats = groupLcovRecordsByCoverageType(
    mergedResults,
    coverageTypes,
  );

  const gitRoot = await getGitRoot();

  return coverageTypes
    .map(coverageType => {
      const stats = totalCoverageStats[coverageType];
      if (!stats) {
        return null;
      }
      return lcovCoverageToAuditOutput(stats, coverageType, gitRoot);
    })
    .filter(exists);
}

/**
 *
 * @param results Paths to LCOV results
 * @returns Array of parsed LCOVRecords.
 */
export async function parseLcovFiles(
  results: CoverageResult[],
): Promise<LCOVRecord[]> {
  const parsedResults = (
    await Promise.all(
      results.map(async result => {
        const resultsPath =
          typeof result === 'string' ? result : result.resultsPath;
        const lcovFileContent = await readTextFile(resultsPath);
        if (lcovFileContent.trim() === '') {
          ui().logger.warning(
            `Coverage plugin: Empty lcov report file detected at ${resultsPath}.`,
          );
        }
        const parsedRecords = parseLcov(toUnixNewlines(lcovFileContent));
        return parsedRecords.map(
          (record): LCOVRecord => ({
            title: record.title,
            file:
              typeof result === 'string' || result.pathToProject == null
                ? record.file
                : path.join(result.pathToProject, record.file),
            functions: filterOutInvalidLines(record, 'functions'),
            branches: filterOutInvalidLines(record, 'branches'),
            lines: filterOutInvalidLines(record, 'lines'),
          }),
        );
      }),
    )
  ).flat();

  if (parsedResults.length === 0) {
    throw new Error('All provided coverage results are empty.');
  }

  return parsedResults;
}

/**
 * Filters out invalid line numbers.
 *
 * Some tools like pytest-cov emit line number 0. https://github.com/nedbat/coveragepy/issues/1846
 *
 * @param record LCOV record
 * @param type Coverage type
 * @returns Coverage output from record without invalid line numbers
 */
function filterOutInvalidLines<T extends 'branches' | 'functions' | 'lines'>(
  record: LCOVRecord,
  type: T,
): LCOVRecord[T] {
  const stats = record[type];
  return {
    ...stats,
    details: stats.details.filter(detail => detail.line > 0),
  };
}

/**
 * This function aggregates coverage stats from all coverage files
 * @param records LCOV record for each file
 * @param coverageTypes Types of coverage to be gathered
 * @returns Complete coverage stats for all defined types of coverage.
 */
function groupLcovRecordsByCoverageType<T extends CoverageType>(
  records: LCOVRecord[],
  coverageTypes: T[],
): Partial<Record<T, FileCoverage[]>> {
  return records.reduce<Partial<Record<T, FileCoverage[]>>>(
    (acc, record) =>
      objectFromEntries(
        objectToEntries(
          getCoverageStatsFromLcovRecord(record, coverageTypes),
        ).map(([type, file]) => [type, [...(acc[type] ?? []), file]]),
      ),
    {},
  );
}

/**
 * @param record record file data
 * @param coverageTypes types of coverage to be gathered
 * @returns Relevant coverage data from one lcov record file.
 */
function getCoverageStatsFromLcovRecord<T extends CoverageType>(
  record: LCOVRecord,
  coverageTypes: T[],
): Record<T, FileCoverage> {
  return objectFromEntries(
    coverageTypes.map(coverageType => [
      coverageType,
      recordToStatFunctionMapper[coverageType](record),
    ]),
  );
}
