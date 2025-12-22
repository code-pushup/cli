import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getGitRoot, logger } from '@code-pushup/utils';
import type { CoverageResult, CoverageType } from '../../config.js';
import { lcovResultsToAuditOutputs, parseLcovFiles } from './lcov-runner.js';

vi.mock('@code-pushup/utils', async () => {
  const actual = await vi.importActual('@code-pushup/utils');
  return {
    ...actual,
    getGitRoot: vi.fn(),
  };
});

describe('parseLcovFiles', () => {
  const UTILS_REPORT = `
TN:
SF:${path.join('common', 'utils.ts')}
FNF:0
FNH:0
DA:1,1
DA:2,0
LF:2
LH:1
BRDA:1,0,0,6
BRF:1
BRH:1
end_of_record
`;

  const CONSTANTS_REPORT = `
TN:
SF:${path.join('src', 'lib', 'constants.ts')}
FNF:0
FNH:0
DA:1,1
LF:1
LH:1
BRF:0
BRH:0
end_of_record
`;

  const PYTEST_REPORT = `
TN:
SF:kw/__init__.py
DA:1,1,gG9L/J2A/IwO9tZM1raZxQ
DA:0,0,gG9L/J2A/IwO9tZM1raZxQ
LF:2
LH:3
BRF:0
BRH:0
end_of_record
`;

  const MULTI_FILE_REPORT = `
TN:
SF:${path.join('file1', 'test.ts')}
FNF:1
FNH:1
DA:1,1
LF:1
LH:1
BRF:0
BRH:0
end_of_record
TN:
SF:${path.join('file2', 'test.ts')}
FNF:0
FNH:0
DA:1,0
LF:1
LH:0
BRF:1
BRH:0
end_of_record
`;

  beforeEach(() => {
    vol.fromJSON(
      {
        [path.join('integration-tests', 'lcov.info')]: UTILS_REPORT, // file name value under SF used in tests
        [path.join('unit-tests', 'lcov.info')]: CONSTANTS_REPORT, // file name value under SF used in tests
        [path.join('pytest', 'lcov.info')]: PYTEST_REPORT,
        [path.join('multi', 'lcov.info')]: MULTI_FILE_REPORT,
        'lcov.info': '', // empty report file
      },
      'coverage',
    );
  });

  it('should identify coverage path passed as a string', async () => {
    await expect(
      parseLcovFiles([path.join('coverage', 'integration-tests', 'lcov.info')]),
    ).resolves.toEqual([
      expect.objectContaining({ file: path.join('common', 'utils.ts') }),
    ]);
  });

  it('should identify coverage path passed as an object and prepend project path to LCOV report', async () => {
    await expect(
      parseLcovFiles([
        {
          resultsPath: path.join('coverage', 'unit-tests', 'lcov.info'),
          pathToProject: path.join('packages', 'cli'),
        },
      ]),
    ).resolves.toEqual([
      expect.objectContaining({
        file: path.join('packages', 'cli', 'src', 'lib', 'constants.ts'),
      }),
    ]);
  });

  it('should correctly identify a mix of coverage path formats', async () => {
    await expect(
      parseLcovFiles([
        {
          resultsPath: path.join('coverage', 'unit-tests', 'lcov.info'),
          pathToProject: path.join('packages', 'cli'),
        },
        path.join('coverage', 'integration-tests', 'lcov.info'),
      ]),
    ).resolves.toEqual([
      expect.objectContaining({
        file: path.join('packages', 'cli', 'src', 'lib', 'constants.ts'),
      }),
      expect.objectContaining({
        file: path.join('common', 'utils.ts'),
      }),
    ]);
  });

  it('should throw for only empty reports', async () => {
    await expect(() =>
      parseLcovFiles([path.join('coverage', 'lcov.info')]),
    ).rejects.toThrow('All provided coverage results are empty.');
  });

  it('should warn about an empty lcov file', async () => {
    await parseLcovFiles([
      path.join('coverage', 'integration-tests', 'lcov.info'),
      path.join('coverage', 'lcov.info'),
    ]);

    expect(logger.warn).toHaveBeenCalledWith(
      `Empty LCOV report file detected at ${path.join(
        'coverage',
        'lcov.info',
      )}.`,
    );
  });

  it('should skip lines numbered 0', async () => {
    await expect(
      parseLcovFiles([path.join('coverage', 'pytest', 'lcov.info')]),
    ).resolves.toEqual([
      expect.objectContaining({
        lines: {
          found: 2,
          hit: 2, // not 3
          details: [
            { hit: 1, line: 1 },
            // no { hit: 0, line: 0 },
          ],
        },
      }),
    ]);
  });

  it('should sanitize hit values to not exceed found values when invalid stats are encountered', async () => {
    const invalidReport = `
TN:
SF:${path.join('invalid', 'file.ts')}
FNF:2
FNH:3
DA:1,1
DA:2,1
LF:2
LH:3
BRF:1
BRH:2
end_of_record
`;

    vol.fromJSON(
      {
        [path.join('invalid', 'lcov.info')]: invalidReport,
      },
      'coverage',
    );

    const result = await parseLcovFiles([
      path.join('coverage', 'invalid', 'lcov.info'),
    ]);

    expect(result[0]?.functions.hit).toBe(2);
    expect(result[0]?.lines.hit).toBe(2);
    expect(result[0]?.branches.hit).toBe(1);
  });

  it('should handle multiple files with different coverage types', async () => {
    const result = await parseLcovFiles([
      path.join('coverage', 'multi', 'lcov.info'),
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]?.file).toBe(path.join('file1', 'test.ts'));
    expect(result[1]?.file).toBe(path.join('file2', 'test.ts'));
    expect(result[0]?.functions.hit).toBe(1);
    expect(result[1]?.functions.hit).toBe(0);
  });

  it('should handle edge case with no branches or functions', async () => {
    const edgeCaseReport = `
TN:
SF:${path.join('edge', 'case.ts')}
FNF:0
FNH:0
DA:1,1
LF:1
LH:1
BRF:0
BRH:0
end_of_record
`;

    vol.fromJSON(
      {
        [path.join('edge', 'lcov.info')]: edgeCaseReport,
      },
      'coverage',
    );

    const result = await parseLcovFiles([
      path.join('coverage', 'edge', 'lcov.info'),
    ]);

    expect(result[0]?.functions.hit).toBe(0);
    expect(result[0]?.functions.found).toBe(0);
    expect(result[0]?.branches.hit).toBe(0);
    expect(result[0]?.branches.found).toBe(0);
    expect(result[0]?.lines.hit).toBe(1);
    expect(result[0]?.lines.found).toBe(1);
  });
});

describe('lcovResultsToAuditOutputs', () => {
  const mockResults: CoverageResult[] = [
    {
      resultsPath: path.join('coverage', 'test', 'lcov.info'),
      pathToProject: 'packages/cli',
    },
  ];

  const mockCoverageTypes: CoverageType[] = ['function', 'branch', 'line'];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGitRoot).mockResolvedValue('/mock/git/root');

    const testReport = `
TN:
SF:${path.join('src', 'test.ts')}
FNF:1
FNH:1
DA:1,1
LF:1
LH:1
BRF:1
BRH:1
end_of_record
`;

    vol.fromJSON(
      {
        [path.join('test', 'lcov.info')]: testReport,
      },
      'coverage',
    );
  });

  it('should return audit outputs for all coverage types', async () => {
    const result = await lcovResultsToAuditOutputs(
      mockResults,
      mockCoverageTypes,
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty('slug', 'function-coverage');
    expect(result[1]).toHaveProperty('slug', 'branch-coverage');
    expect(result[2]).toHaveProperty('slug', 'line-coverage');
  });

  it('should handle single coverage type', async () => {
    const result = await lcovResultsToAuditOutputs(mockResults, ['function']);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('slug', 'function-coverage');
  });

  it('should handle empty coverage types array', async () => {
    const result = await lcovResultsToAuditOutputs(mockResults, []);

    expect(result).toHaveLength(0);
  });

  it('should handle getGitRoot failure gracefully', async () => {
    vi.mocked(getGitRoot).mockRejectedValue(new Error('Git root not found'));

    await expect(
      lcovResultsToAuditOutputs(mockResults, mockCoverageTypes),
    ).rejects.toThrow('Git root not found');
  });

  it('should handle multiple results with different project paths', async () => {
    const multiResults: CoverageResult[] = [
      {
        resultsPath: path.join('coverage', 'test', 'lcov.info'),
        pathToProject: 'packages/cli',
      },
      {
        resultsPath: path.join('coverage', 'test2', 'lcov.info'),
        pathToProject: 'packages/utils',
      },
    ];

    const testReport2 = `
TN:
SF:${path.join('src', 'utils.ts')}
FNF:2
FNH:1
DA:1,1
DA:2,0
LF:2
LH:1
BRF:1
BRH:0
end_of_record
`;

    vol.fromJSON(
      {
        [path.join('test2', 'lcov.info')]: testReport2,
      },
      'coverage',
    );

    const result = await lcovResultsToAuditOutputs(multiResults, ['function']);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('slug', 'function-coverage');
  });

  it('should handle string results path', async () => {
    const stringResults: CoverageResult[] = [
      path.join('coverage', 'test', 'lcov.info'),
    ];

    const result = await lcovResultsToAuditOutputs(stringResults, ['line']);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('slug', 'line-coverage');
  });

  it('should handle mixed results format', async () => {
    const mixedResults: CoverageResult[] = [
      path.join('coverage', 'test', 'lcov.info'),
      {
        resultsPath: path.join('coverage', 'test2', 'lcov.info'),
        pathToProject: 'packages/utils',
      },
    ];

    const testReport2 = `
TN:
SF:${path.join('src', 'utils.ts')}
FNF:1
FNH:1
DA:1,1
LF:1
LH:1
BRF:0
BRH:0
end_of_record
`;

    vol.fromJSON(
      {
        [path.join('test2', 'lcov.info')]: testReport2,
      },
      'coverage',
    );

    const result = await lcovResultsToAuditOutputs(mixedResults, ['function']);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('slug', 'function-coverage');
  });
});
