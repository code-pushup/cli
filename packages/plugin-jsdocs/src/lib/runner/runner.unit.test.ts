import type { FileCoverage } from '@code-pushup/utils';
import type { CoverageType } from './models.js';
import { trasformCoverageReportToAuditOutputs } from './runner.js';

describe('trasformCoverageReportToAudits', () => {
  const mockCoverageResult = {
    functions: [
      {
        path: 'test.ts',
        covered: 3,
        total: 4,
        missing: [{ startLine: 10, kind: 'function', name: 'testFunction' }],
      },
    ],
    classes: [
      {
        path: 'test.ts',
        covered: 2,
        total: 2,
        missing: [{ startLine: 10, kind: 'class', name: 'testClass' }],
      },
    ],
  } as Record<CoverageType, FileCoverage[]>;

  it('should return all audits from the coverage result when no filters are provided', () => {
    const result = trasformCoverageReportToAuditOutputs(
      mockCoverageResult,
      {},
      process.cwd(),
    );
    expect(result.map(item => item.slug)).toStrictEqual([
      'functions-coverage',
      'classes-coverage',
    ]);
  });

  it('should filter audits when onlyAudits is provided', () => {
    const result = trasformCoverageReportToAuditOutputs(
      mockCoverageResult,
      {
        onlyAudits: ['functions-coverage'],
      },
      process.cwd(),
    );
    expect(result).toHaveLength(1);
    expect(result.map(item => item.slug)).toStrictEqual(['functions-coverage']);
  });

  it('should filter audits when skipAudits is provided', () => {
    const result = trasformCoverageReportToAuditOutputs(
      mockCoverageResult,
      {
        skipAudits: ['functions-coverage'],
      },
      process.cwd(),
    );
    expect(result).toHaveLength(1);
    expect(result.map(item => item.slug)).toStrictEqual(['classes-coverage']);
  });

  it('should handle properly empty coverage result', () => {
    const result = trasformCoverageReportToAuditOutputs(
      {} as Record<CoverageType, FileCoverage[]>,
      {},
      process.cwd(),
    );
    expect(result).toEqual([]);
  });

  it('should calculate coverage for multiple node types', () => {
    const result = trasformCoverageReportToAuditOutputs(
      mockCoverageResult,
      {},
      process.cwd(),
    );
    expect(result).toHaveLength(2);
    expect(result[0]!.score).toBe(0.75);
    expect(result[1]!.score).toBe(1);
  });
});
