import path from 'node:path';
import type { LCOVRecord } from 'parse-lcov';
import type { AuditOutputs, TableColumnObject } from '@code-pushup/models';
import {
  type FileCoverage,
  aggregateCoverageStats,
  capitalize,
  exists,
  formatAsciiTable,
  formatCoveragePercentage,
  getGitRoot,
  logger,
  objectFromEntries,
  objectToEntries,
  pluralize,
  pluralizeToken,
  readTextFile,
  toUnixNewlines,
  truncatePaths,
} from '@code-pushup/utils';
import type { CoverageResult, CoverageType } from '../../config.js';
import { ALL_COVERAGE_TYPES } from '../../constants.js';
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
  logMergedRecords({ before: lcovResults.length, after: mergedResults.length });

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
  const recordsPerReport = Object.fromEntries(
    await Promise.all(results.map(parseLcovFile)),
  );

  logLcovRecords(recordsPerReport);

  const allRecords = Object.values(recordsPerReport).flat();
  if (allRecords.length === 0) {
    throw new Error('All provided coverage results are empty.');
  }

  return allRecords;
}

async function parseLcovFile(
  result: CoverageResult,
): Promise<[string, LCOVRecord[]]> {
  const resultsPath = typeof result === 'string' ? result : result.resultsPath;
  const lcovFileContent = await readTextFile(resultsPath);
  if (lcovFileContent.trim() === '') {
    logger.warn(`Empty LCOV report file detected at ${resultsPath}.`);
  }
  const parsedRecords = parseLcov(toUnixNewlines(lcovFileContent));
  logger.debug(`Parsed LCOV report file at ${resultsPath}`);
  return [
    resultsPath,
    parsedRecords.map(
      (record): LCOVRecord => ({
        title: record.title,
        file:
          typeof result === 'string' || result.pathToProject == null
            ? record.file
            : path.join(result.pathToProject, record.file),
        functions: patchInvalidStats(record, 'functions'),
        branches: patchInvalidStats(record, 'branches'),
        lines: patchInvalidStats(record, 'lines'),
      }),
    ),
  ];
}

/**
 * Filters out invalid `line` numbers, and ensures `hit <= found`.
 * @param record LCOV record
 * @param type Coverage type
 * @returns Patched stats for type in record
 */
function patchInvalidStats<T extends 'branches' | 'functions' | 'lines'>(
  record: LCOVRecord,
  type: T,
): LCOVRecord[T] {
  const stats = record[type];
  return {
    ...stats,
    hit: Math.min(stats.hit, stats.found),
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
  coverageTypes: readonly T[],
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
  coverageTypes: readonly T[],
): Record<T, FileCoverage> {
  return objectFromEntries(
    coverageTypes.map(coverageType => [
      coverageType,
      recordToStatFunctionMapper[coverageType](record),
    ]),
  );
}

function logLcovRecords(recordsPerReport: Record<string, LCOVRecord[]>): void {
  const reportPaths = Object.keys(recordsPerReport);
  const reportsCount = reportPaths.length;
  const sourceFilesCount = new Set(
    Object.values(recordsPerReport)
      .flat()
      .map(record => record.file),
  ).size;
  logger.info(
    `Parsed ${pluralizeToken('LCOV report', reportsCount)}, coverage collected from ${pluralizeToken('source file', sourceFilesCount)}`,
  );

  if (!logger.isVerbose()) {
    return;
  }

  const truncatedPaths = truncatePaths(reportPaths);

  logger.newline();
  logger.debug(
    formatAsciiTable({
      columns: [
        { key: 'report', label: 'LCOV report', align: 'left' },
        { key: 'filesCount', label: 'Files', align: 'right' },
        ...ALL_COVERAGE_TYPES.map(
          (type): TableColumnObject => ({
            key: type,
            label: capitalize(pluralize(type)),
            align: 'right',
          }),
        ),
      ],
      rows: Object.entries(recordsPerReport).map(
        ([reportPath, records], idx) => {
          const groups = groupLcovRecordsByCoverageType(
            records,
            ALL_COVERAGE_TYPES,
          );
          const stats: Record<CoverageType, string> = objectFromEntries(
            objectToEntries(groups).map(([type, files = []]) => [
              type,
              formatCoveragePercentage(aggregateCoverageStats(files)),
            ]),
          );
          const report = truncatedPaths[idx] ?? reportPath;
          return { report, filesCount: records.length, ...stats };
        },
      ),
    }),
  );
  logger.newline();
}

function logMergedRecords(counts: { before: number; after: number }): void {
  if (counts.before === counts.after) {
    logger.debug(
      counts.after === 1
        ? 'There is only 1 LCOV record' // should be rare
        : `All of ${pluralizeToken('LCOV record', counts.after)} have unique source files`,
    );
  } else {
    logger.info(
      `Merged ${counts.before} into ${pluralizeToken('unique LCOV record', counts.after)} per source file`,
    );
  }
}
