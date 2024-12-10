import type {
  BranchesDetails,
  FunctionsDetails,
  LCOVRecord,
  LinesDetails,
} from 'parse-lcov';
import { describe, expect, it } from 'vitest';
import {
  mergeDuplicateLcovRecords,
  mergeLcovBranchesDetails,
  mergeLcovFunctionsDetails,
  mergeLcovLineDetails,
  mergeLcovResults,
} from './merge-lcov.js';

describe('mergeLcovResults', () => {
  it('should merge duplicates and keep unique reports', () => {
    const UNIQUE_REPORT = {
      title: '',
      file: 'src/index.ts',
      branches: { found: 0, hit: 0, details: [] },
      lines: { found: 1, hit: 0, details: [{ line: 1, hit: 0 }] },
      functions: {
        found: 1,
        hit: 1,
        details: [{ line: 1, name: 'sum', hit: 3 }],
      },
    };

    expect(
      mergeLcovResults([
        {
          title: '',
          file: 'src/commands.ts',
          branches: {
            found: 1,
            hit: 1,
            details: [{ line: 1, block: 1, branch: 0, taken: 2 }],
          },
          lines: {
            found: 2,
            hit: 2,
            details: [
              { line: 1, hit: 2 },
              { line: 2, hit: 1 },
            ],
          },
          functions: { found: 0, hit: 0, details: [] },
        },
        UNIQUE_REPORT,
        {
          title: '',
          file: 'src/commands.ts',
          branches: {
            found: 1,
            hit: 1,
            details: [{ line: 1, block: 1, branch: 0, taken: 0 }],
          },
          lines: {
            found: 2,
            hit: 1,
            details: [
              { line: 1, hit: 0 },
              { line: 3, hit: 3 },
            ],
          },
          functions: { found: 0, hit: 0, details: [] },
        },
      ]),
    ).toStrictEqual<LCOVRecord[]>([
      {
        title: '',
        file: 'src/commands.ts',
        branches: {
          found: 1,
          hit: 1,
          details: [{ line: 1, block: 1, branch: 0, taken: 2 }],
        },
        lines: {
          found: 3,
          hit: 3,
          details: [
            { line: 1, hit: 2 },
            { line: 2, hit: 1 },
            { line: 3, hit: 3 },
          ],
        },
        functions: { found: 0, hit: 0, details: [] },
      },
      UNIQUE_REPORT,
    ]);
  });
});

describe('mergeDuplicateLcovRecords', () => {
  it('should merge multiple records', () => {
    expect(
      mergeDuplicateLcovRecords([
        {
          title: '',
          file: 'src/commands.ts',
          branches: {
            found: 2,
            hit: 1,
            details: [
              { line: 1, block: 1, branch: 0, taken: 2 },
              { line: 1, block: 1, branch: 1, taken: 0 },
            ],
          },
          lines: {
            found: 3,
            hit: 2,
            details: [
              { line: 1, hit: 2 },
              { line: 2, hit: 1 },
              { line: 3, hit: 0 },
            ],
          },
          functions: {
            found: 1,
            hit: 0,
            details: [{ line: 1, name: 'sum', hit: 0 }],
          },
        },
        {
          title: '',
          file: 'src/commands.ts',
          branches: {
            found: 2,
            hit: 1,
            details: [
              { line: 1, block: 1, branch: 0, taken: 0 },
              { line: 1, block: 1, branch: 1, taken: 1 },
            ],
          },
          lines: {
            found: 3,
            hit: 2,
            details: [
              { line: 1, hit: 0 },
              { line: 2, hit: 1 },
              { line: 3, hit: 3 },
            ],
          },
          functions: {
            found: 1,
            hit: 1,
            details: [{ line: 1, name: 'sum', hit: 3 }],
          },
        },
      ]),
    ).toStrictEqual<LCOVRecord>({
      title: '',
      file: 'src/commands.ts',
      branches: {
        found: 2,
        hit: 2,
        details: [
          { line: 1, block: 1, branch: 0, taken: 2 },
          { line: 1, block: 1, branch: 1, taken: 1 },
        ],
      },
      lines: {
        found: 3,
        hit: 3,
        details: [
          { line: 1, hit: 2 },
          { line: 2, hit: 2 },
          { line: 3, hit: 3 },
        ],
      },
      functions: {
        found: 1,
        hit: 1,
        details: [{ line: 1, name: 'sum', hit: 3 }],
      },
    });
  });
});

describe('mergeLcovLineDetails', () => {
  it('should sum number of times a line was hit', () => {
    expect(
      mergeLcovLineDetails([
        [
          { line: 1, hit: 1 },
          { line: 2, hit: 2 },
        ],
        [
          { line: 1, hit: 2 },
          { line: 2, hit: 1 },
        ],
      ]),
    ).toStrictEqual<LinesDetails[]>([
      { line: 1, hit: 3 },
      { line: 2, hit: 3 },
    ]);
  });

  it('should include all unique lines', () => {
    expect(
      mergeLcovLineDetails([
        [
          { line: 1, hit: 1 },
          { line: 2, hit: 0 },
          { line: 4, hit: 2 },
        ],
        [
          { line: 1, hit: 0 },
          { line: 2, hit: 1 },
          { line: 3, hit: 0 },
        ],
      ]),
    ).toStrictEqual<LinesDetails[]>([
      { line: 1, hit: 1 },
      { line: 2, hit: 1 },
      { line: 4, hit: 2 },
      { line: 3, hit: 0 },
    ]);
  });
});

describe('mergeLcovBranchDetails', () => {
  it('should sum number of times a branch was taken', () => {
    expect(
      mergeLcovBranchesDetails([
        [
          { line: 1, block: 0, branch: 0, taken: 1 },
          { line: 1, block: 0, branch: 1, taken: 0 },
        ],
        [
          { line: 1, block: 0, branch: 0, taken: 1 },
          { line: 1, block: 0, branch: 1, taken: 1 },
        ],
      ]),
    ).toStrictEqual<BranchesDetails[]>([
      { line: 1, block: 0, branch: 0, taken: 2 },
      { line: 1, block: 0, branch: 1, taken: 1 },
    ]);
  });

  it('should include all unique branches', () => {
    expect(
      mergeLcovBranchesDetails([
        [
          { line: 1, block: 0, branch: 0, taken: 1 },
          { line: 1, block: 0, branch: 1, taken: 0 },
        ],
        [
          { line: 1, block: 0, branch: 0, taken: 1 },
          { line: 3, block: 0, branch: 0, taken: 0 },
        ],
      ]),
    ).toStrictEqual<BranchesDetails[]>([
      { line: 1, block: 0, branch: 0, taken: 2 },
      { line: 1, block: 0, branch: 1, taken: 0 },
      { line: 3, block: 0, branch: 0, taken: 0 },
    ]);
  });
});

describe('mergeLcovFunctionsDetails', () => {
  it('should sum number of times a function was hit', () => {
    expect(
      mergeLcovFunctionsDetails([
        [
          { line: 1, name: 'sum', hit: 1 },
          { line: 5, name: 'mult', hit: 2 },
        ],
        [
          { line: 1, name: 'sum', hit: 0 },
          { line: 5, name: 'mult', hit: 0 },
        ],
      ]),
    ).toStrictEqual<FunctionsDetails[]>([
      { line: 1, name: 'sum', hit: 1 },
      { line: 5, name: 'mult', hit: 2 },
    ]);
  });

  it('should include all unique functions', () => {
    expect(
      mergeLcovFunctionsDetails([
        [
          { line: 1, name: 'sum', hit: 1 },
          { line: 5, name: 'mult', hit: 2 },
        ],
        [
          { line: 1, name: 'sum', hit: 3 },
          { line: 7, name: 'div', hit: 0 },
        ],
      ]),
    ).toStrictEqual<FunctionsDetails[]>([
      { line: 1, name: 'sum', hit: 4 },
      { line: 5, name: 'mult', hit: 2 },
      { line: 7, name: 'div', hit: 0 },
    ]);
  });
});
