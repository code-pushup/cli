import type {
  BranchesDetails,
  FunctionsDetails,
  LCOVRecord,
  LinesDetails,
} from 'parse-lcov';
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

  it('should return records unchanged when no duplicates exist', () => {
    const records = [
      {
        title: '',
        file: 'src/file1.ts',
        branches: { found: 0, hit: 0, details: [] },
        lines: { found: 1, hit: 1, details: [{ line: 1, hit: 1 }] },
        functions: { found: 0, hit: 0, details: [] },
      },
      {
        title: '',
        file: 'src/file2.ts',
        branches: { found: 0, hit: 0, details: [] },
        lines: { found: 1, hit: 0, details: [{ line: 1, hit: 0 }] },
        functions: { found: 0, hit: 0, details: [] },
      },
    ];

    expect(mergeLcovResults(records)).toStrictEqual(records);
  });

  it('should handle empty records array', () => {
    expect(mergeLcovResults([])).toStrictEqual([]);
  });

  it('should handle single record', () => {
    const singleRecord = {
      title: '',
      file: 'src/single.ts',
      branches: { found: 0, hit: 0, details: [] },
      lines: { found: 1, hit: 1, details: [{ line: 1, hit: 1 }] },
      functions: { found: 0, hit: 0, details: [] },
    };

    expect(mergeLcovResults([singleRecord])).toStrictEqual([singleRecord]);
  });

  it('should handle duplicates with different line counts', () => {
    const records = [
      {
        title: '',
        file: 'src/file.ts',
        branches: { found: 0, hit: 0, details: [] },
        lines: {
          found: 2,
          hit: 1,
          details: [
            { line: 1, hit: 1 },
            { line: 2, hit: 0 },
          ],
        },
        functions: { found: 0, hit: 0, details: [] },
      },
      {
        title: '',
        file: 'src/file.ts',
        branches: { found: 0, hit: 0, details: [] },
        lines: {
          found: 2,
          hit: 1,
          details: [
            { line: 1, hit: 1 },
            { line: 2, hit: 0 },
          ],
        },
        functions: { found: 0, hit: 0, details: [] },
      },
    ];

    const result = mergeLcovResults(records);
    expect(result).toHaveLength(1);
    expect(result[0]?.file).toBe('src/file.ts');
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

  it('should handle records with zero hit counts', () => {
    const records = [
      {
        title: '',
        file: 'src/file.ts',
        branches: { found: 0, hit: 0, details: [] },
        lines: {
          found: 2,
          hit: 0,
          details: [
            { line: 1, hit: 0 },
            { line: 2, hit: 0 },
          ],
        },
        functions: {
          found: 1,
          hit: 0,
          details: [{ line: 1, name: 'func', hit: 0 }],
        },
      },
      {
        title: '',
        file: 'src/file.ts',
        branches: { found: 0, hit: 0, details: [] },
        lines: {
          found: 2,
          hit: 0,
          details: [
            { line: 1, hit: 0 },
            { line: 2, hit: 0 },
          ],
        },
        functions: {
          found: 1,
          hit: 0,
          details: [{ line: 1, name: 'func', hit: 0 }],
        },
      },
    ];

    const result = mergeDuplicateLcovRecords(records);
    expect(result.lines.hit).toBe(0);
    expect(result.functions.hit).toBe(0);
    expect(result.branches.hit).toBe(0);
  });

  it('should handle records with null function hit values', () => {
    const records = [
      {
        title: '',
        file: 'src/file.ts',
        branches: { found: 0, hit: 0, details: [] },
        lines: { found: 1, hit: 1, details: [{ line: 1, hit: 1 }] },
        functions: {
          found: 1,
          hit: 0,
          details: [{ line: 1, name: 'func', hit: undefined }],
        },
      },
      {
        title: '',
        file: 'src/file.ts',
        branches: { found: 0, hit: 0, details: [] },
        lines: { found: 1, hit: 1, details: [{ line: 1, hit: 1 }] },
        functions: {
          found: 1,
          hit: 0,
          details: [{ line: 1, name: 'func', hit: 2 }],
        },
      },
    ];

    const result = mergeDuplicateLcovRecords(records);
    expect(result.functions.hit).toBe(1); // Only the second record has hit > 0
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

  it('should handle empty details arrays', () => {
    expect(mergeLcovLineDetails([])).toStrictEqual([]);
    expect(mergeLcovLineDetails([[]])).toStrictEqual([]);
    expect(mergeLcovLineDetails([[], []])).toStrictEqual([]);
  });

  it('should handle single line details', () => {
    expect(
      mergeLcovLineDetails([[{ line: 1, hit: 5 }], [{ line: 1, hit: 3 }]]),
    ).toStrictEqual<LinesDetails[]>([{ line: 1, hit: 8 }]);
  });

  it('should handle negative hit values', () => {
    expect(
      mergeLcovLineDetails([[{ line: 1, hit: -1 }], [{ line: 1, hit: 2 }]]),
    ).toStrictEqual<LinesDetails[]>([{ line: 1, hit: 1 }]);
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

  it('should handle empty details arrays', () => {
    expect(mergeLcovBranchesDetails([])).toStrictEqual([]);
    expect(mergeLcovBranchesDetails([[]])).toStrictEqual([]);
    expect(mergeLcovBranchesDetails([[], []])).toStrictEqual([]);
  });

  it('should handle complex branch structures', () => {
    expect(
      mergeLcovBranchesDetails([
        [
          { line: 1, block: 1, branch: 0, taken: 1 },
          { line: 1, block: 1, branch: 1, taken: 0 },
          { line: 2, block: 2, branch: 0, taken: 1 },
        ],
        [
          { line: 1, block: 1, branch: 0, taken: 1 },
          { line: 1, block: 1, branch: 1, taken: 1 },
          { line: 3, block: 3, branch: 0, taken: 0 },
        ],
      ]),
    ).toStrictEqual<BranchesDetails[]>([
      { line: 1, block: 1, branch: 0, taken: 2 },
      { line: 1, block: 1, branch: 1, taken: 1 },
      { line: 2, block: 2, branch: 0, taken: 1 },
      { line: 3, block: 3, branch: 0, taken: 0 },
    ]);
  });

  it('should handle negative taken values', () => {
    expect(
      mergeLcovBranchesDetails([
        [{ line: 1, block: 0, branch: 0, taken: -1 }],
        [{ line: 1, block: 0, branch: 0, taken: 2 }],
      ]),
    ).toStrictEqual<BranchesDetails[]>([
      { line: 1, block: 0, branch: 0, taken: 1 },
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

  it('should handle empty details arrays', () => {
    expect(mergeLcovFunctionsDetails([])).toStrictEqual([]);
    expect(mergeLcovFunctionsDetails([[]])).toStrictEqual([]);
    expect(mergeLcovFunctionsDetails([[], []])).toStrictEqual([]);
  });

  it('should handle undefined hit values', () => {
    expect(
      mergeLcovFunctionsDetails([
        [{ line: 1, name: 'func', hit: undefined }],
        [{ line: 1, name: 'func', hit: 2 }],
      ]),
    ).toStrictEqual<FunctionsDetails[]>([{ line: 1, name: 'func', hit: 2 }]);
  });

  it('should handle multiple undefined hit values', () => {
    expect(
      mergeLcovFunctionsDetails([
        [{ line: 1, name: 'func', hit: undefined }],
        [{ line: 1, name: 'func', hit: undefined }],
      ]),
    ).toStrictEqual<FunctionsDetails[]>([{ line: 1, name: 'func', hit: 0 }]);
  });

  it('should handle functions with same name but different lines', () => {
    expect(
      mergeLcovFunctionsDetails([
        [
          { line: 1, name: 'func', hit: 1 },
          { line: 5, name: 'func', hit: 2 },
        ],
        [
          { line: 1, name: 'func', hit: 3 },
          { line: 5, name: 'func', hit: 1 },
        ],
      ]),
    ).toStrictEqual<FunctionsDetails[]>([
      { line: 1, name: 'func', hit: 4 },
      { line: 5, name: 'func', hit: 3 },
    ]);
  });

  it('should handle negative hit values', () => {
    expect(
      mergeLcovFunctionsDetails([
        [{ line: 1, name: 'func', hit: -1 }],
        [{ line: 1, name: 'func', hit: 3 }],
      ]),
    ).toStrictEqual<FunctionsDetails[]>([{ line: 1, name: 'func', hit: 2 }]);
  });
});
