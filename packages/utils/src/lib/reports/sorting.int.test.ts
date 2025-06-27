import { REPORT_MOCK } from '@code-pushup/test-utils';
import { scoreReport } from './scoring.js';
import { sortReport } from './sorting.js';

describe('sortReport', () => {
  it('should sort the audits and audit groups in categories, plugin audits and audit issues', () => {
    /*
      Sorting of the report is based on:
        - for category audits and audit groups: weight, score, value, title
        - for plugin audits: score, value, title
        - for audit issues: score, value, title

      The sorted report mock has the following data after sorting:

      Categories:

      Test results
      -> Cypress E2E: weight 3
      -> CyCT:        weight 1
      => score = 0.625

      Bug prevention
      -> TypeScript ESLint group:      weight 8
        -> ts-eslint-typing            weight 3
        -> ts-eslint-enums             weight 1
        -> ts-eslint-experimental      weight 0

      -> TypeScript ESLint functional: weight 1
      -> ESLint Jest naming:           weight 1
      -> ESLint Cypress:               weight 0
      => score = 0.3

      Plugins:

      Cypress results
      -> Cypress E2E: score 0.5, value 3
        -> error: Test `Display progress for selected commit` failed.
        -> error: Test `Sort audit table based on value` failed.
        -> error: Test `Open Bug prevention category detail` failed.
      -> CyCT:        score 1, value 0

      ESLint
      -> Type checking:                   score 0, value 2
        -> error: outputFile does not exist in type Cli.
        -> warning: command might be undefined.
      -> Functional principles:           score 0, value 1
        -> error: Unexpected let, use const instead.
      -> Typescript experimental checks   score 0, value 1
        -> info: Use better-enums.
      -> Consistent naming:               score 1, value 0
      -> Cypress rules:                   score 1, value 0
      -> Enumeration value checks:        score 1, value 0
    */
    const sortedReport = sortReport(scoreReport(REPORT_MOCK));
    expect(sortedReport).toMatchSnapshot();
  });

  it('should sort a report with no categories', () => {
    const sortedReport = sortReport(
      scoreReport({ ...REPORT_MOCK, categories: undefined }),
    );
    expect(sortedReport).toEqual(
      expect.objectContaining({ categories: undefined }),
    );
  });
});
