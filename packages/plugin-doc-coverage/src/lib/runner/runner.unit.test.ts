import type { DocumentationCoverageReport } from './models.js';
import { trasformCoverageReportToAudits } from './runner.js';

describe('trasformCoverageReportToAudits', () => {
  const mockCoverageResult = {
    functions: {
      coverage: 75,
      nodesCount: 4,
      issues: [
        {
          file: 'test.ts',
          line: 10,
          name: 'testFunction',
          type: 'functions',
        },
      ],
    },
    classes: {
      coverage: 100,
      nodesCount: 2,
      issues: [
        {
          file: 'test.ts',
          line: 10,
          name: 'testClass',
          type: 'classes',
        },
      ],
    },
  } as unknown as DocumentationCoverageReport;

  it('should return all audits from the coverage result when no filters are provided', () => {
    const result = trasformCoverageReportToAudits(mockCoverageResult, {});
    expect(result.map(item => item.slug)).toStrictEqual([
      'functions-coverage',
      'classes-coverage',
    ]);
  });

  it('should filter audits when onlyAudits is provided', () => {
    const result = trasformCoverageReportToAudits(mockCoverageResult, {
      onlyAudits: ['functions-coverage'],
    });
    expect(result).toHaveLength(1);
    expect(result.map(item => item.slug)).toStrictEqual(['functions-coverage']);
  });

  it('should filter audits when skipAudits is provided', () => {
    const result = trasformCoverageReportToAudits(mockCoverageResult, {
      skipAudits: ['functions-coverage'],
    });
    expect(result).toHaveLength(1);
    expect(result.map(item => item.slug)).toStrictEqual(['classes-coverage']);
  });

  it('should handle properly empty coverage result', () => {
    const result = trasformCoverageReportToAudits(
      {} as unknown as DocumentationCoverageReport,
      {},
    );
    expect(result).toEqual([]);
  });

  it('should handle coverage result with multiple issues and add them to the details.issue of the report', () => {
    const expectedIssues = 2;
    const result = trasformCoverageReportToAudits(mockCoverageResult, {});
    expect(result).toHaveLength(2);
    expect(
      result.reduce(
        (acc, item) => acc + (item.details?.issues?.length ?? 0),
        0,
      ),
    ).toBe(expectedIssues);
  });
});
