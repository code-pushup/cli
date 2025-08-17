import type { LCOVRecord } from 'parse-lcov';
import type { AuditOutput } from '@code-pushup/models';
import {
  type FileCoverage,
  capitalize,
  filesCoverageToTree,
  toNumberPrecision,
} from '@code-pushup/utils';
import type { CoverageType } from '../../config.js';
import { INVALID_FUNCTION_NAME } from '../constants.js';
import { mergeConsecutiveNumbers } from './utils.js';

export function lcovReportToFunctionStat(record: LCOVRecord): FileCoverage {
  const validRecord = removeEmptyReport(record);

  return {
    path: validRecord.file,
    covered: validRecord.functions.hit,
    total: validRecord.functions.found,
    missing: validRecord.functions.details
      .filter(detail => !detail.hit)
      .map(detail => ({
        startLine: detail.line,
        kind: 'function',
        name: detail.name,
      })),
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

export function lcovReportToLineStat(record: LCOVRecord): FileCoverage {
  const lines = record.lines.details
    .filter(detail => !detail.hit)
    .map(detail => detail.line);

  const lineRanges = mergeConsecutiveNumbers(lines);

  return {
    path: record.file,
    covered: record.lines.hit,
    total: record.lines.found,
    missing: lineRanges.map(({ start, end }) => ({
      startLine: start,
      endLine: end,
    })),
  };
}

export function lcovReportToBranchStat(record: LCOVRecord): FileCoverage {
  return {
    path: record.file,
    covered: record.branches.hit,
    total: record.branches.found,
    missing: record.branches.details
      .filter(detail => !detail.taken)
      .map(detail => ({
        startLine: detail.line,
        kind: 'branch',
        name: detail.branch.toString(),
      })),
  };
}

export const recordToStatFunctionMapper: Record<
  CoverageType,
  (record: LCOVRecord) => FileCoverage
> = {
  branch: lcovReportToBranchStat,
  line: lcovReportToLineStat,
  function: lcovReportToFunctionStat,
};

/**
 *
 * @param files code coverage of given type for all files
 * @param coverageType code coverage type
 * @param gitRoot root directory in repo, for relative paths
 * @returns Result of complete code ccoverage data coverted to AuditOutput
 */
export function lcovCoverageToAuditOutput(
  files: FileCoverage[],
  coverageType: CoverageType,
  gitRoot: string,
): AuditOutput {
  const tree = filesCoverageToTree(
    files,
    gitRoot,
    `${capitalize(coverageType)} coverage`,
  );
  const coverage = tree.root.values.coverage;
  const MAX_DECIMAL_PLACES = 4;
  const coveragePercentage = coverage * 100;

  return {
    slug: `${coverageType}-coverage`,
    score: toNumberPrecision(coverage, MAX_DECIMAL_PLACES),
    value: coveragePercentage,
    displayValue: `${toNumberPrecision(coveragePercentage, 1)} %`,
    details: {
      trees: [tree],
    },
  };
}
