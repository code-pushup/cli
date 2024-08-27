import type { LCOVRecord } from 'parse-lcov';
import { describe, it } from 'vitest';
import type { AuditOutput, Issue } from '@code-pushup/models';
import { INVALID_FUNCTION_NAME } from '../constants';
import {
  lcovCoverageToAuditOutput,
  lcovReportToBranchStat,
  lcovReportToFunctionStat,
  lcovReportToLineStat,
} from './transform';
import type { LCOVStat } from './types';

const lcovRecordMock: LCOVRecord = {
  file: 'cli.ts',
  title: '',
  branches: { details: [], hit: 0, found: 0 },
  functions: { details: [], hit: 0, found: 0 },
  lines: { details: [], hit: 0, found: 0 },
};

describe('lcovReportToFunctionStat', () => {
  it('should transform a fully covered function report to LCOV stat', () => {
    expect(
      lcovReportToFunctionStat({
        ...lcovRecordMock,
        functions: {
          hit: 1,
          found: 1,
          details: [{ line: 12, name: 'yargsCli', hit: 6 }],
        },
      }),
    ).toEqual<LCOVStat>({ totalHit: 1, totalFound: 1, issues: [] });
  });

  it('should transform an empty LCOV function report to LCOV stat', () => {
    expect(
      lcovReportToFunctionStat({
        ...lcovRecordMock,
        functions: { hit: 0, found: 0, details: [] },
      }),
    ).toEqual<LCOVStat>({
      totalHit: 0,
      totalFound: 0,
      issues: [],
    });
  });

  it('should transform details from function report to issues', () => {
    expect(
      lcovReportToFunctionStat({
        ...lcovRecordMock,
        functions: {
          hit: 0,
          found: 1,
          details: [{ line: 12, name: 'yargsCli', hit: 0 }],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        issues: [
          {
            message: 'Function yargsCli is not called in any test case.',
            severity: 'error',
            source: { file: 'cli.ts', position: { startLine: 12 } },
          } satisfies Issue,
        ],
      }),
    );
  });

  it('should skip covered functions when transforming details to issues', () => {
    expect(
      lcovReportToFunctionStat({
        ...lcovRecordMock,
        functions: {
          hit: 1,
          found: 2,
          details: [
            { line: 12, name: 'yargsCli', hit: 6 },
            { line: 20, name: 'cliError', hit: 0 },
          ],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        issues: [
          {
            message: 'Function cliError is not called in any test case.',
            severity: 'error',
            source: { file: 'cli.ts', position: { startLine: 20 } },
          } satisfies Issue,
        ],
      }),
    );
  });

  it('should skip a record of uncovered invalid function called (empty-report)', () => {
    expect(
      lcovReportToFunctionStat({
        ...lcovRecordMock,
        functions: {
          hit: 1,
          found: 2,
          details: [
            { line: 1, name: INVALID_FUNCTION_NAME, hit: 0 },
            { line: 5, name: 'transform', hit: 4 },
          ],
        },
      }),
    ).toStrictEqual<LCOVStat>({
      totalFound: 1,
      totalHit: 1,
      issues: [],
    });
  });
});

describe('lcovReportToLineStat', () => {
  it('should transform a fully covered line report to LCOV stat', () => {
    expect(
      lcovReportToLineStat({
        ...lcovRecordMock,
        lines: {
          hit: 1,
          found: 1,
          details: [{ line: 1, hit: 6 }],
        },
      }),
    ).toEqual<LCOVStat>({
      totalHit: 1,
      totalFound: 1,
      issues: [],
    });
  });

  it('should transform an empty LCOV line report to LCOV stat', () => {
    expect(
      lcovReportToLineStat({
        ...lcovRecordMock,
        lines: { hit: 0, found: 0, details: [] },
      }),
    ).toEqual<LCOVStat>({
      totalHit: 0,
      totalFound: 0,
      issues: [],
    });
  });

  it('should transform details from line report to issues', () => {
    expect(
      lcovReportToLineStat({
        ...lcovRecordMock,
        lines: {
          hit: 0,
          found: 1,
          details: [{ line: 1, hit: 0 }],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        issues: [
          {
            message: 'Line 1 is not covered in any test case.',
            severity: 'warning',
            source: { file: 'cli.ts', position: { startLine: 1 } },
          } satisfies Issue,
        ],
      }),
    );
  });

  it('should skip covered lines when transforming details to issues', () => {
    expect(
      lcovReportToLineStat({
        ...lcovRecordMock,
        lines: {
          hit: 1,
          found: 2,
          details: [
            { line: 1, hit: 1 },
            { line: 2, hit: 0 },
          ],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        issues: [
          {
            message: 'Line 2 is not covered in any test case.',
            severity: 'warning',
            source: { file: 'cli.ts', position: { startLine: 2 } },
          } satisfies Issue,
        ],
      }),
    );
  });

  it('should merge consecutive lines to one issue', () => {
    expect(
      lcovReportToLineStat({
        ...lcovRecordMock,
        lines: {
          hit: 2,
          found: 6,
          details: [
            { line: 1, hit: 1 },
            { line: 2, hit: 0 },
            { line: 3, hit: 0 },
            { line: 4, hit: 0 },
            { line: 5, hit: 1 },
            { line: 6, hit: 0 },
          ],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        issues: [
          {
            message: 'Lines 2-4 are not covered in any test case.',
            severity: 'warning',
            source: { file: 'cli.ts', position: { startLine: 2, endLine: 4 } },
          },

          {
            message: 'Line 6 is not covered in any test case.',
            severity: 'warning',
            source: { file: 'cli.ts', position: { startLine: 6 } },
          },
        ] satisfies Issue[],
      }),
    );
  });
});

describe('lcovReportToBranchStat', () => {
  it('should transform a fully covered branch report to LCOV stat', () => {
    expect(
      lcovReportToBranchStat({
        ...lcovRecordMock,
        branches: {
          hit: 1,
          found: 1,
          details: [{ line: 12, taken: 6, branch: 0, block: 0 }],
        },
      }),
    ).toEqual<LCOVStat>({
      totalHit: 1,
      totalFound: 1,
      issues: [],
    });
  });

  it('should transform an empty LCOV branch report to LCOV stat', () => {
    expect(
      lcovReportToBranchStat({
        ...lcovRecordMock,
        branches: { hit: 0, found: 0, details: [] },
      }),
    ).toEqual<LCOVStat>({
      totalHit: 0,
      totalFound: 0,
      issues: [],
    });
  });

  it('should transform details from branch report to issues', () => {
    expect(
      lcovReportToBranchStat({
        ...lcovRecordMock,
        branches: {
          hit: 0,
          found: 1,
          details: [{ line: 12, taken: 0, branch: 0, block: 0 }],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        issues: [
          {
            message: '1st branch is not taken in any test case.',
            severity: 'error',
            source: { file: 'cli.ts', position: { startLine: 12 } },
          } satisfies Issue,
        ],
      }),
    );
  });

  it('should skip a covered branch when transforming details to issues', () => {
    expect(
      lcovReportToBranchStat({
        ...lcovRecordMock,
        branches: {
          hit: 1,
          found: 2,
          details: [
            { line: 15, taken: 3, branch: 0, block: 1 },
            { line: 20, taken: 0, branch: 1, block: 0 },
          ],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        issues: [
          {
            message: '2nd branch is not taken in any test case.',
            severity: 'error',
            source: { file: 'cli.ts', position: { startLine: 20 } },
          } satisfies Issue,
        ],
      }),
    );
  });
});

describe('lcovCoverageToAudit', () => {
  it('should transform full branch coverage to audit output', () => {
    expect(
      lcovCoverageToAuditOutput(
        { totalHit: 56, totalFound: 56, issues: [] },
        'branch',
      ),
    ).toEqual<AuditOutput>({
      slug: 'branch-coverage',
      score: 1,
      value: 100,
      displayValue: '100 %',
      details: { issues: [] },
    });
  });

  it('should transform an empty function coverage to audit output', () => {
    expect(
      lcovCoverageToAuditOutput(
        { totalHit: 0, totalFound: 0, issues: [] },
        'function',
      ),
    ).toEqual<AuditOutput>({
      slug: 'function-coverage',
      score: 1,
      value: 100,
      displayValue: '100 %',
      details: { issues: [] },
    });
  });

  it('should transform a partial line coverage to audit output', () => {
    expect(
      lcovCoverageToAuditOutput(
        {
          totalHit: 9,
          totalFound: 10,
          issues: [
            {
              message: 'Line 2 is not covered in any test case.',
              severity: 'warning',
              source: { file: 'cli.ts', position: { startLine: 2 } },
            },
          ],
        },
        'line',
      ),
    ).toEqual<AuditOutput>({
      slug: 'line-coverage',
      score: 0.9,
      value: 90,
      displayValue: '90 %',
      details: {
        issues: [
          {
            message: 'Line 2 is not covered in any test case.',
            severity: 'warning',
            source: { file: 'cli.ts', position: { startLine: 2 } },
          },
        ],
      },
    });
  });
});
