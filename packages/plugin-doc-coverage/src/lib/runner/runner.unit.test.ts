import type { CoverageResult } from './models.js';
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
      issues: [],
    },
  } as unknown as CoverageResult;

  it('should transform coverage report to audit outputs with no filters', () => {
    const result = trasformCoverageReportToAudits(mockCoverageResult, {});
    expect(result).toMatchSnapshot();
  });

  it('should filter audits when onlyAudits is provided', () => {
    const result = trasformCoverageReportToAudits(mockCoverageResult, {
      onlyAudits: ['functions-coverage'],
    });
    expect(result).toMatchSnapshot();
  });

  it('should filter audits when skipAudits is provided', () => {
    const result = trasformCoverageReportToAudits(mockCoverageResult, {
      skipAudits: ['classes-coverage'],
    });
    expect(result).toMatchSnapshot();
  });

  it('should handle empty coverage result', () => {
    const result = trasformCoverageReportToAudits(
      {} as unknown as CoverageResult,
      {},
    );
    expect(result).toMatchSnapshot();
  });

  it('should handle coverage result with multiple issues', () => {
    const coverageWithMultipleIssues = {
      functions: {
        coverage: 50,
        nodesCount: 4,
        issues: [
          {
            file: 'test1.ts',
            line: 10,
            name: 'function1',
            type: 'functions',
          },
          {
            file: 'test2.ts',
            line: 20,
            name: 'function2',
            type: 'functions',
          },
        ],
      },
    } as unknown as CoverageResult;

    const result = trasformCoverageReportToAudits(
      coverageWithMultipleIssues,
      {},
    );
    expect(result).toMatchSnapshot();
  });

  it('should prioritize onlyAudits over skipAudits when both are provided', () => {
    const result = trasformCoverageReportToAudits(mockCoverageResult, {
      onlyAudits: ['functions-coverage'],
      skipAudits: ['functions-coverage'],
    });
    expect(result).toMatchSnapshot();
  });
});
