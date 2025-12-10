import type { ESLint } from 'eslint';
import { type LintResultsStats, aggregateLintResultsStats } from './stats.js';

describe('aggregateLintResultsStats', () => {
  it('should sum all errors and warning across all files', () => {
    expect(
      aggregateLintResultsStats([
        {
          filePath: 'src/main.js',
          messages: [{ severity: 2 }],
        },
        {
          filePath: 'src/lib/index.js',
          messages: [{ severity: 2 }, { severity: 1 }],
        },
        {
          filePath: 'src/lib/utils.js',
          messages: [
            { severity: 1 },
            { severity: 1 },
            { severity: 2 },
            { severity: 1 },
          ],
        },
      ] as ESLint.LintResult[]),
    ).toEqual(
      expect.objectContaining<Partial<LintResultsStats>>({
        problemsCount: 7,
      }),
    );
  });

  it('should count files with problems', () => {
    expect(
      aggregateLintResultsStats([
        { filePath: 'src/main.js', messages: [{}] },
        { filePath: 'src/lib/index.js', messages: [{}, {}] },
        { filePath: 'src/lib/utils.js', messages: [{}, {}, {}] },
      ] as ESLint.LintResult[]),
    ).toEqual(
      expect.objectContaining<Partial<LintResultsStats>>({
        failedFilesCount: 3,
      }),
    );
  });

  it('should count unique rules with reported problems', () => {
    expect(
      aggregateLintResultsStats([
        { filePath: 'src/lib/main.js', messages: [{}] }, // empty ruleId ignored
        {
          filePath: 'src/lib/index.js',
          messages: [{ ruleId: 'max-lines' }, { ruleId: 'no-unused-vars' }],
        },
        {
          filePath: 'src/lib/utils.js',
          messages: [
            { ruleId: 'no-unused-vars' },
            { ruleId: 'eqeqeq' },
            { ruleId: 'no-unused-vars' },
            { ruleId: 'yoda' },
            { ruleId: 'eqeqeq' },
          ],
        },
      ] as ESLint.LintResult[]),
    ).toEqual(
      expect.objectContaining<Partial<LintResultsStats>>({
        failedRulesCount: 4, // no-unused-vars (3), eqeqeq (2), max-lines (1), yoda (1)
      }),
    );
  });
});
