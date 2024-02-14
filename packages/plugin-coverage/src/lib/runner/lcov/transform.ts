import { LCOVRecord } from 'parse-lcov';
import { AuditOutput, Issue } from '@code-pushup/models';
import { toNumberPrecision, toOrdinal } from '@code-pushup/utils';
import { CoverageType } from '../../config';
import { LCOVStat } from './types';
import { calculateCoverage, mergeConsecutiveNumbers } from './utils';

export function lcovReportToFunctionStat(record: LCOVRecord): LCOVStat {
  return {
    totalFound: record.functions.found,
    totalHit: record.functions.hit,
    issues:
      record.functions.hit < record.functions.found
        ? record.functions.details
            .filter(detail => !detail.hit)
            .map(
              (detail): Issue => ({
                message: `Function ${detail.name} is not called in any test case.`,
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
  const roundedIntValue = toNumberPrecision(coverage * 100, 0);

  return {
    slug: `${coverageType}-coverage`,
    score: toNumberPrecision(coverage, MAX_DECIMAL_PLACES),
    value: roundedIntValue,
    displayValue: `${roundedIntValue} %`,
    ...(stat.issues.length > 0 && { details: { issues: stat.issues } }),
  };
}
