import type { ReportsDiff } from '@code-pushup/models';
import {
  type ReportsToCompare,
  compareAudits,
  compareCategories,
  compareGroups,
} from './compare-scorables';

describe('compareCategories', () => {
  it('should match categories by slug and check for equal scores', () => {
    expect(
      compareCategories({
        before: {
          categories: [
            { slug: 'perf', title: 'Performance', score: 0.42 },
            { slug: 'tests', title: 'Tests', score: 0.66 },
            { slug: 'code', title: 'Code quality', score: 0.88 },
          ],
        },
        after: {
          categories: [
            { slug: 'perf', title: 'Performance', score: 0.32 }, // regressed
            { slug: 'tests', title: 'Tests passing', score: 0.69 }, // renamed + improved
            { slug: 'code', title: 'Code quality', score: 0.88 },
            { slug: 'security', title: 'Security', score: 1 }, // added
          ],
        },
      } as ReportsToCompare),
    ).toEqual<ReportsDiff['categories']>({
      changed: [
        {
          slug: 'perf',
          title: 'Performance',
          scores: { before: 0.42, after: 0.32, diff: expect.closeTo(-0.1) },
        },
        {
          slug: 'tests',
          title: 'Tests passing',
          scores: { before: 0.66, after: 0.69, diff: expect.closeTo(0.03) },
        },
      ],
      unchanged: [{ slug: 'code', title: 'Code quality', score: 0.88 }],
      added: [{ slug: 'security', title: 'Security', score: 1 }],
      removed: [],
    });
  });
});

describe('compareGroups', () => {
  it('should match groups by plugin-scoped slug and check for equal scores', () => {
    expect(
      compareGroups({
        before: {
          plugins: [
            {
              slug: 'eslint',
              title: 'ESLint',
              groups: [
                { slug: 'problems', title: 'Problems', score: 0.4 },
                { slug: 'suggestions', title: 'Suggestions', score: 0.5 },
                { slug: 'formatting', title: 'Formatting', score: 0.9 },
              ],
            },
            {
              slug: 'prettier',
              title: 'Prettier',
              groups: [
                { slug: 'formatting', title: 'Code formatting', score: 0 },
              ],
            },
          ],
        },
        after: {
          plugins: [
            {
              slug: 'eslint',
              title: 'ESLint',
              groups: [
                { slug: 'problems', title: 'Problems', score: 0.4 },
                { slug: 'suggestions', title: 'Suggestions', score: 0.4 }, // regressed
                { slug: 'formatting', title: 'Formatting', score: 0.95 }, // improved
              ],
            },
            {
              slug: 'prettier',
              title: 'Prettier',
              groups: [
                { slug: 'formatting', title: 'Formatting', score: 0 }, // renamed
              ],
            },
          ],
        },
      } as ReportsToCompare),
    ).toEqual<ReportsDiff['groups']>({
      changed: [
        {
          slug: 'suggestions',
          title: 'Suggestions',
          plugin: { slug: 'eslint', title: 'ESLint' },
          scores: {
            before: 0.5,
            after: 0.4,
            diff: expect.closeTo(-0.1),
          },
        },
        {
          slug: 'formatting',
          title: 'Formatting',
          plugin: { slug: 'eslint', title: 'ESLint' },
          scores: {
            before: 0.9,
            after: 0.95,
            diff: expect.closeTo(0.05),
          },
        },
      ],
      unchanged: [
        {
          slug: 'problems',
          title: 'Problems',
          plugin: { slug: 'eslint', title: 'ESLint' },
          score: 0.4,
        },
        {
          slug: 'formatting',
          title: 'Formatting', // renaming doesn't count as change
          plugin: { slug: 'prettier', title: 'Prettier' },
          score: 0,
        },
      ],
      added: [],
      removed: [],
    });
  });
});

describe('compareAudits', () => {
  it('should match audits by plugin-scoped slug and check for equal scores and values', () => {
    expect(
      compareAudits({
        before: {
          plugins: [
            {
              slug: 'eslint',
              title: 'ESLint',
              audits: [
                {
                  slug: 'eqeqeq',
                  title: 'Require the use of `===` and `!==`',
                  score: 1,
                  value: 0,
                  displayValue: 'passed',
                },
                {
                  slug: 'no-case-declarations',
                  title: 'Disallow lexical declarations in case clauses',
                  score: 0,
                  value: 12,
                  displayValue: '12 errors',
                },
                {
                  slug: 'no-eval',
                  title: 'Disallow the use of eval()',
                  score: 1,
                  value: 0,
                  displayValue: 'passed',
                },
                {
                  slug: 'no-var',
                  title: 'Require `let` or `const` instead of `var`',
                  score: 0,
                  value: 5,
                  displayValue: '5 warnings',
                },
              ],
            },
          ],
        },
        after: {
          plugins: [
            {
              slug: 'eslint',
              title: 'ESLint',
              audits: [
                {
                  slug: 'eqeqeq',
                  title: 'Require the use of `===` and `!==`',
                  // score and value changed
                  score: 0,
                  value: 1,
                  displayValue: '1 error',
                },
                // no-case-declarations audit removed
                {
                  slug: 'no-eval',
                  title: 'Disallow the use of eval()',
                  // unchanged
                  score: 1,
                  value: 0,
                  displayValue: 'passed',
                },
                {
                  slug: 'no-var',
                  title: 'Require `let` or `const` instead of `var`',
                  // only value changed
                  score: 0,
                  value: 3,
                  displayValue: '3 warnings',
                },
              ],
            },
            // plugin added
            {
              slug: 'coverage',
              title: 'Code coverage',
              audits: [
                {
                  slug: 'function-coverage',
                  title: 'Function coverage',
                  score: 0.8,
                  value: 80,
                  displayValue: '80 %',
                },
              ],
            },
          ],
        },
      } as ReportsToCompare),
    ).toEqual<ReportsDiff['audits']>({
      changed: [
        {
          slug: 'eqeqeq',
          title: 'Require the use of `===` and `!==`',
          plugin: { slug: 'eslint', title: 'ESLint' },
          scores: { before: 1, after: 0, diff: -1 },
          values: { before: 0, after: 1, diff: 1 },
          displayValues: { before: 'passed', after: '1 error' },
        },
        {
          slug: 'no-var',
          title: 'Require `let` or `const` instead of `var`',
          plugin: { slug: 'eslint', title: 'ESLint' },
          scores: { before: 0, after: 0, diff: 0 },
          values: { before: 5, after: 3, diff: -2 },
          displayValues: { before: '5 warnings', after: '3 warnings' },
        },
      ],
      unchanged: [
        {
          slug: 'no-eval',
          title: 'Disallow the use of eval()',
          plugin: { slug: 'eslint', title: 'ESLint' },
          score: 1,
          value: 0,
          displayValue: 'passed',
        },
      ],
      added: [
        {
          slug: 'function-coverage',
          title: 'Function coverage',
          plugin: { slug: 'coverage', title: 'Code coverage' },
          score: 0.8,
          value: 80,
          displayValue: '80 %',
        },
      ],
      removed: [
        {
          slug: 'no-case-declarations',
          title: 'Disallow lexical declarations in case clauses',
          plugin: { slug: 'eslint', title: 'ESLint' },
          score: 0,
          value: 12,
          displayValue: '12 errors',
        },
      ],
    });
  });
});
