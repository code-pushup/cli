import type { LCOVRecord } from 'parse-lcov';
import type { AuditOutput, Issue } from '@code-pushup/models';
import { toNumberPrecision, toOrdinal } from '@code-pushup/utils';
import type { CoverageType } from '../../config';
import { INVALID_FUNCTION_NAME } from '../constants';
import type { LCOVStat } from './types';
import { calculateCoverage, mergeConsecutiveNumbers } from './utils';

export function lcovReportToFunctionStat(record: LCOVRecord): LCOVStat {
  const validRecord = removeEmptyReport(record);

  return {
    totalFound: validRecord.functions.found,
    totalHit: validRecord.functions.hit,
    issues:
      validRecord.functions.hit < validRecord.functions.found
        ? validRecord.functions.details
            .filter(detail => !detail.hit)
            .map(
              (detail): Issue => ({
                message: `Function ${detail.name} is not called in any test case.`,
                severity: 'error',
                source: {
                  file: validRecord.file,
                  position: { startLine: detail.line },
                },
              }),
            )
        : [],
  };
}

function removeEmptyReport(record: LCOVRecord): LCOVRecord {
  const validFunctions = record.functions.details.filter(
    detail => detail.name !== INVALID_FUNCTION_NAME,
  );

  if (validFunctions.length === record.functions.found) {
    return record;
  }

  return {
    ...record,
    functions: {
      details: validFunctions,
      found: validFunctions.length,
      hit: validFunctions.reduce(
        (acc, fn) => acc + (fn.hit != null && fn.hit > 0 ? 1 : 0),
        0,
      ),
    },
  };
}

export function lcovReportToLineStat(record: LCOVRecord): LCOVStat {
  const missingCoverage = record.lines.hit < record.lines.found;
  const lines = missingCoverage
    ? record.lines.details
        .filter(detail => !detail.hit)
        .map(detail => detail.line)
    : [];

  const linePositions = mergeConsecutiveNumbers(lines);

  return {
    totalFound: record.lines.found,
    totalHit: record.lines.hit,
    issues: missingCoverage
      ? linePositions.map((linePosition): Issue => {
          const lineReference =
            linePosition.end == null
              ? `Line ${linePosition.start} is`
              : `Lines ${linePosition.start}-${linePosition.end} are`;

          return {
            message: `${lineReference} not covered in any test case.`,
            severity: 'warning',
            source: {
              file: record.file,
              position: {
                startLine: linePosition.start,
                endLine: linePosition.end,
              },
            },
          };
        })
      : [],
  };
}

export function lcovReportToBranchStat(record: LCOVRecord): LCOVStat {
  return {
    totalFound: record.branches.found,
    totalHit: record.branches.hit,
    issues:
      record.branches.hit < record.branches.found
        ? record.branches.details
            .filter(detail => !detail.taken)
            .map(
              (detail): Issue => ({
                message: `${toOrdinal(
                  detail.branch + 1,
                )} branch is not taken in any test case.`,
                severity: 'error',
                source: {
                  file: record.file,
                  position: { startLine: detail.line },
                },
              }),
            )
        : [],
  };
}

export const recordToStatFunctionMapper = {
  branch: lcovReportToBranchStat,
  line: lcovReportToLineStat,
  function: lcovReportToFunctionStat,
};

/**
 *
 * @param stat code coverage result for a given type
 * @param coverageType code coverage type
 * @returns Result of complete code ccoverage data coverted to AuditOutput
 */
export function lcovCoverageToAuditOutput(
  stat: LCOVStat,
  coverageType: CoverageType,
): AuditOutput {
  const coverage = calculateCoverage(stat.totalHit, stat.totalFound);
  const MAX_DECIMAL_PLACES = 4;
  const coveragePercentage = coverage * 100;

  return {
    slug: `${coverageType}-coverage`,
    score: toNumberPrecision(coverage, MAX_DECIMAL_PLACES),
    value: coveragePercentage,
    displayValue: `${toNumberPrecision(coveragePercentage, 1)} %`,
    details: {
      issues: stat.issues,
    },
  };
}
