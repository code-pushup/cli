import path from 'node:path';
import type { LCOVRecord } from 'parse-lcov';
import type { AuditOutput } from '@code-pushup/models';
import type { FileCoverage } from '@code-pushup/utils';
import { INVALID_FUNCTION_NAME } from '../constants.js';
import {
  lcovCoverageToAuditOutput,
  lcovReportToBranchStat,
  lcovReportToFunctionStat,
  lcovReportToLineStat,
} from './transform.js';

const lcovRecordMock: LCOVRecord = {
  file: 'bin.js',
  title: '',
  branches: { details: [], hit: 0, found: 0 },
  functions: { details: [], hit: 0, found: 0 },
  lines: { details: [], hit: 0, found: 0 },
};

describe('lcovReportToFunctionStat', () => {
  it('should transform a fully covered function report', () => {
    expect(
      lcovReportToFunctionStat({
        ...lcovRecordMock,
        file: 'src/main.ts',
        functions: {
          hit: 1,
          found: 1,
          details: [{ line: 12, name: 'yargsCli', hit: 6 }],
        },
      }),
    ).toEqual<FileCoverage>({
      path: 'src/main.ts',
      covered: 1,
      total: 1,
      missing: [],
    });
  });

  it('should transform an empty LCOV function report', () => {
    expect(
      lcovReportToFunctionStat({
        ...lcovRecordMock,
        file: 'src/main.ts',
        functions: { hit: 0, found: 0, details: [] },
      }),
    ).toEqual<FileCoverage>({
      path: 'src/main.ts',
      covered: 0,
      total: 0,
      missing: [],
    });
  });

  it('should transform details from function report to missing lines of code', () => {
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
      expect.objectContaining<Partial<FileCoverage>>({
        missing: [
          {
            kind: 'function',
            name: 'yargsCli',
            startLine: 12,
          },
        ],
      }),
    );
  });

  it('should skip covered functions when transforming details to missing lines of code', () => {
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
      expect.objectContaining<Partial<FileCoverage>>({
        missing: [
          {
            kind: 'function',
            name: 'cliError',
            startLine: 20,
          },
        ],
      }),
    );
  });

  it('should skip a record of uncovered invalid function called (empty-report)', () => {
    expect(
      lcovReportToFunctionStat({
        ...lcovRecordMock,
        file: 'src/main.ts',
        functions: {
          hit: 1,
          found: 2,
          details: [
            { line: 1, name: INVALID_FUNCTION_NAME, hit: 0 },
            { line: 5, name: 'transform', hit: 4 },
          ],
        },
      }),
    ).toStrictEqual<FileCoverage>({
      path: 'src/main.ts',
      total: 1,
      covered: 1,
      missing: [],
    });
  });
});

describe('lcovReportToLineStat', () => {
  it('should transform a fully covered line report', () => {
    expect(
      lcovReportToLineStat({
        ...lcovRecordMock,
        file: 'src/main.ts',
        lines: {
          hit: 1,
          found: 1,
          details: [{ line: 1, hit: 6 }],
        },
      }),
    ).toEqual<FileCoverage>({
      path: 'src/main.ts',
      covered: 1,
      total: 1,
      missing: [],
    });
  });

  it('should transform an empty LCOV line report', () => {
    expect(
      lcovReportToLineStat({
        ...lcovRecordMock,
        file: 'src/main.ts',
        lines: { hit: 0, found: 0, details: [] },
      }),
    ).toEqual<FileCoverage>({
      path: 'src/main.ts',
      covered: 0,
      total: 0,
      missing: [],
    });
  });

  it('should transform details from line report to missing lines of code', () => {
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
      expect.objectContaining<Partial<FileCoverage>>({
        missing: [{ startLine: 1 }],
      }),
    );
  });

  it('should skip covered lines when transforming details to missing lines of code', () => {
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
      expect.objectContaining<Partial<FileCoverage>>({
        missing: [{ startLine: 2 }],
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
      expect.objectContaining<Partial<FileCoverage>>({
        missing: [{ startLine: 2, endLine: 4 }, { startLine: 6 }],
      }),
    );
  });
});

describe('lcovReportToBranchStat', () => {
  it('should transform a fully covered branch report', () => {
    expect(
      lcovReportToBranchStat({
        ...lcovRecordMock,
        file: 'src/main.ts',
        branches: {
          hit: 1,
          found: 1,
          details: [{ line: 12, taken: 6, branch: 0, block: 0 }],
        },
      }),
    ).toEqual<FileCoverage>({
      path: 'src/main.ts',
      covered: 1,
      total: 1,
      missing: [],
    });
  });

  it('should transform an empty LCOV branch report', () => {
    expect(
      lcovReportToBranchStat({
        ...lcovRecordMock,
        file: 'src/main.ts',
        branches: { hit: 0, found: 0, details: [] },
      }),
    ).toEqual<FileCoverage>({
      path: 'src/main.ts',
      covered: 0,
      total: 0,
      missing: [],
    });
  });

  it('should transform details from branch report to missing lines of code', () => {
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
      expect.objectContaining<Partial<FileCoverage>>({
        missing: [
          {
            kind: 'branch',
            name: '0',
            startLine: 12,
          },
        ],
      }),
    );
  });

  it('should skip a covered branch when transforming details to missing lines of code', () => {
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
      expect.objectContaining<Partial<FileCoverage>>({
        missing: [
          {
            kind: 'branch',
            name: '1',
            startLine: 20,
          },
        ],
      }),
    );
  });
});

describe('lcovCoverageToAudit', () => {
  it('should transform full branch coverage to audit output', () => {
    expect(
      lcovCoverageToAuditOutput(
        [
          {
            path: path.join(process.cwd(), 'main.js'),
            covered: 2,
            total: 2,
            missing: [],
          },
        ],
        'branch',
        process.cwd(),
      ),
    ).toEqual<AuditOutput>({
      slug: 'branch-coverage',
      score: 1,
      value: 100,
      displayValue: '100 %',
      details: {
        trees: [
          {
            type: 'coverage',
            title: 'Branch coverage',
            root: {
              name: '.',
              values: { coverage: 1 },
              children: [
                { name: 'main.js', values: { coverage: 1, missing: [] } },
              ],
            },
          },
        ],
      },
    });
  });

  it('should transform an empty function coverage to audit output', () => {
    expect(
      lcovCoverageToAuditOutput(
        [
          {
            path: path.join(process.cwd(), 'release.js'),
            covered: 0,
            total: 0,
            missing: [],
          },
        ],
        'function',
        process.cwd(),
      ),
    ).toEqual<AuditOutput>({
      slug: 'function-coverage',
      score: 1,
      value: 100,
      displayValue: '100 %',
      details: {
        trees: [
          {
            type: 'coverage',
            title: 'Function coverage',
            root: {
              name: '.',
              values: { coverage: 1 },
              children: [
                { name: 'release.js', values: { coverage: 1, missing: [] } },
              ],
            },
          },
        ],
      },
    });
  });

  it('should transform a partial line coverage to audit output', () => {
    expect(
      lcovCoverageToAuditOutput(
        [
          {
            path: path.join(process.cwd(), 'bin.js'),
            covered: 0,
            total: 5,
            missing: [{ startLine: 1, endLine: 5 }],
          },
          {
            path: path.join(process.cwd(), 'src', 'core.js'),
            covered: 50,
            total: 50,
            missing: [],
          },
          {
            path: path.join(process.cwd(), 'src', 'utils.js'),
            covered: 45,
            total: 45,
            missing: [],
          },
        ],
        'line',
        process.cwd(),
      ),
    ).toEqual<AuditOutput>({
      slug: 'line-coverage',
      score: 0.95,
      value: 95,
      displayValue: '95 %',
      details: {
        trees: [
          {
            type: 'coverage',
            title: 'Line coverage',
            root: {
              name: '.',
              values: { coverage: 0.95 },
              children: [
                {
                  name: 'src',
                  values: { coverage: 1 },
                  children: [
                    { name: 'core.js', values: { coverage: 1, missing: [] } },
                    { name: 'utils.js', values: { coverage: 1, missing: [] } },
                  ],
                },
                {
                  name: 'bin.js',
                  values: {
                    coverage: 0,
                    missing: [{ startLine: 1, endLine: 5 }],
                  },
                },
              ],
            },
          },
        ],
      },
    });
  });
});
