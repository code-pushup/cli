import { LCOVRecord } from 'parse-lcov';
import { AuditOutput, Issue } from '@code-pushup/models';
import { toUnixPath } from '@code-pushup/utils';
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
              detail =>
                ({
                  message: `Function ${detail.name} is not called in any test case.`,
                  severity: 'error',
                  source: {
                    file: toUnixPath(record.file),
                    position: { startLine: detail.line },
                  },
                } satisfies Issue),
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
      ? linePositions.map(linePosition => {
          const lineReference =
            linePosition.end == null
              ? `Line ${linePosition.start} is`
              : `Lines ${linePosition.start}-${linePosition.end} are`;

          return {
            message: `${lineReference} not covered in any test case.`,
            severity: 'warning',
            source: {
              file: toUnixPath(record.file),
              position: {
                startLine: linePosition.start,
                endLine: linePosition.end,
              },
            },
          } satisfies Issue;
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
              detail =>
                ({
                  message: `Branch ${detail.branch} is not taken in any test case.`,
                  severity: 'error',
                  source: {
                    file: toUnixPath(record.file),
                    position: { startLine: detail.line },
                  },
                } satisfies Issue),
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
  const coveragePercentage = Math.round(coverage * 100);

  return {
    slug: `${coverageType}-coverage`,
    score: coveragePercentage / 100,
    value: coveragePercentage,
    displayValue: `${coveragePercentage} %`,
    details: stat.issues.length > 0 ? { issues: stat.issues } : undefined,
  };
}
