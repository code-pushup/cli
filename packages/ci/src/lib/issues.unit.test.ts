import type { CategoryRef, Report } from '@code-pushup/models';
import {
  calculateGroupImpact,
  getAuditImpactValue,
  issuesMatch,
} from './issues.js';

describe('issues comparison', () => {
  it('should match issues with exact same metadata', () => {
    expect(
      issuesMatch(
        {
          plugin: { slug: 'coverage', title: 'Code coverage' },
          audit: { slug: 'function-coverage', title: 'Function coverage' },
          message: 'Function formatDate is not called in any test case.',
          severity: 'error',
          source: { file: 'src/utils.ts', position: { startLine: 100 } },
        },
        {
          plugin: { slug: 'coverage', title: 'Code coverage' },
          audit: { slug: 'function-coverage', title: 'Function coverage' },
          message: 'Function formatDate is not called in any test case.',
          severity: 'error',
          source: { file: 'src/utils.ts', position: { startLine: 100 } },
        },
        {
          'src/utils.ts': {
            lineChanges: [
              { prev: { line: 200, count: 0 }, curr: { line: 200, count: 3 } },
            ],
          },
        },
      ),
    ).toBe(true);
  });

  it('should not match issues from different audits', () => {
    expect(
      issuesMatch(
        {
          plugin: { slug: 'coverage', title: 'Code coverage' },
          audit: { slug: 'function-coverage', title: 'Function coverage' },
          message: 'Function formatDate is not called in any test case.',
          severity: 'error',
          source: { file: 'src/utils.ts', position: { startLine: 100 } },
        },
        {
          plugin: { slug: 'eslint', title: 'ESLint' },
          audit: {
            slug: 'typescript-eslint-explicit-function-return-type',
            title:
              'Require explicit return types on functions and class methods.',
          },
          message: 'Missing return type on function.',
          severity: 'error',
          source: { file: 'src/utils.ts', position: { startLine: 100 } },
        },
        {
          'src/utils.ts': {
            lineChanges: [
              { prev: { line: 200, count: 0 }, curr: { line: 200, count: 3 } },
            ],
          },
        },
      ),
    ).toBe(false);
  });

  it('should match issues based on adjusted line', () => {
    expect(
      issuesMatch(
        {
          plugin: { slug: 'coverage', title: 'Code coverage' },
          audit: { slug: 'line-coverage', title: 'Line coverage' },
          message: 'Lines 100-103 are not covered in any test case.',
          severity: 'error',
          source: {
            file: 'src/utils.ts',
            position: { startLine: 100, endLine: 103 },
          },
        },
        {
          plugin: { slug: 'coverage', title: 'Code coverage' },
          audit: { slug: 'line-coverage', title: 'Line coverage' },
          message: 'Lines 102-105 are not covered in any test case.',
          severity: 'error',
          source: {
            file: 'src/utils.ts',
            position: { startLine: 102, endLine: 105 },
          },
        },
        {
          'src/utils.ts': {
            lineChanges: [
              { prev: { line: 42, count: 1 }, curr: { line: 42, count: 3 } },
            ],
          },
        },
      ),
    ).toBe(true);
  });

  it('should match issues from renamed files', () => {
    expect(
      issuesMatch(
        {
          plugin: { slug: 'coverage', title: 'Code coverage' },
          audit: { slug: 'function-coverage', title: 'Function coverage' },
          message: 'Function formatDate is not called in any test case.',
          severity: 'error',
          source: { file: 'src/utils.ts', position: { startLine: 100 } },
        },
        {
          plugin: { slug: 'coverage', title: 'Code coverage' },
          audit: { slug: 'function-coverage', title: 'Function coverage' },
          message: 'Function formatDate is not called in any test case.',
          severity: 'error',
          source: { file: 'src/utils/format.ts', position: { startLine: 100 } },
        },
        {
          'src/utils/format.ts': {
            originalFile: 'src/utils.ts',
            lineChanges: [],
          },
        },
      ),
    ).toBe(true);
  });

  it('should match issues based on adjusted line range', () => {
    expect(
      issuesMatch(
        {
          plugin: { slug: 'eslint', title: 'ESLint' },
          audit: {
            slug: 'max-lines',
            title: 'Enforce a maximum number of lines per file',
          },
          message: 'File has too many lines (420). Maximum allowed is 300.',
          severity: 'warning',
          source: {
            file: 'src/app.component.ts',
            position: { startLine: 300, endLine: 420 },
          },
        },
        {
          plugin: { slug: 'eslint', title: 'ESLint' },
          audit: {
            slug: 'max-lines',
            title: 'Enforce a maximum number of lines per file',
          },
          message: 'File has too many lines (450). Maximum allowed is 300.',
          severity: 'warning',
          source: {
            file: 'src/app.component.ts',
            position: { startLine: 300, endLine: 450 },
          },
        },
        {
          'src/app.component.ts': {
            lineChanges: [
              { prev: { line: 12, count: 0 }, curr: { line: 12, count: 50 } },
              { prev: { line: 123, count: 25 }, curr: { line: 173, count: 5 } },
            ],
          },
        },
      ),
    ).toBe(true);
  });
});

describe('issues sorting', () => {
  it('should sum category contributions to calculate audit impact', () => {
    expect(
      getAuditImpactValue(
        {
          audit: {
            slug: 'react-jsx-key',
            title:
              'Disallow missing `key` props in iterators/collection literals',
          },
          plugin: { slug: 'eslint', title: 'ESLint' },
        },
        {
          categories: [
            {
              title: 'Performance',
              // contributes 1%
              refs: [
                {
                  type: 'group',
                  plugin: 'lighthouse',
                  slug: 'perf',
                  weight: 99,
                },
                {
                  type: 'audit',
                  plugin: 'eslint',
                  slug: 'react-jsx-key',
                  weight: 1,
                },
              ],
            },
            {
              title: 'Accessibility',
              // 0 contribution
              refs: [
                {
                  type: 'group',
                  plugin: 'lighthouse',
                  slug: 'a11y',
                  weight: 100,
                },
              ],
            },
            {
              title: 'Code quality',
              refs: [
                {
                  // group contributes 80%
                  // audit contributes 10% in group
                  // => audit contributes 8% in category
                  type: 'group',
                  plugin: 'eslint',
                  slug: 'problems',
                  weight: 4,
                },
                {
                  // 0 contribution
                  type: 'group',
                  plugin: 'eslint',
                  slug: 'suggestions',
                  weight: 1,
                },
              ],
            },
          ],
          plugins: [
            {
              slug: 'eslint',
              groups: [
                {
                  slug: 'problems',
                  // contributes 10%
                  refs: [
                    ...Array.from({ length: 9 }).map((_, i) => ({
                      slug: `mock-rule-${i}`,
                      weight: 1,
                    })),
                    {
                      slug: 'react-jsx-key',
                      weight: 1,
                    },
                  ],
                },
                {
                  slug: 'suggestions',
                  // 0 contribution
                  refs: Array.from({ length: 10 }).map((_, i) => ({
                    slug: `mock-rule-${10 + i}`,
                    weight: 1,
                  })),
                },
              ],
            },
            {
              slug: 'lighthouse',
              groups: [
                { slug: 'performance', refs: [] },
                { slug: 'a11y', refs: [] },
              ],
            },
          ],
        } as Report,
      ),
    ).toBe(0.09); // 1% + 8% = 9%
  });

  it('should return 0 when there are no categories', () => {
    expect(
      getAuditImpactValue(
        {
          audit: {
            slug: 'react-jsx-key',
            title: 'Disallow missing `key` props in iterators',
          },
          plugin: { slug: 'eslint', title: 'ESLint' },
        },
        {
          plugins: [
            {
              slug: 'eslint',
              groups: [
                {
                  slug: 'suggestions',
                  refs: [{ slug: 'mock-rule', weight: 1 }],
                },
              ],
            },
          ],
        } as Report,
      ),
    ).toBe(0);
  });
});

describe('calculateGroupImpact', () => {
  const mockAudit = {
    slug: 'react-jsx-key',
    title: 'Disallow missing `key` props in iterators',
  };
  const mockCategoryRef = {
    type: 'group',
    plugin: 'eslint',
    slug: 'suggestions',
    weight: 1,
  } as CategoryRef;

  const mockReport = {
    plugins: [
      {
        slug: 'eslint',
        groups: [
          {
            slug: 'suggestions',
            refs: [
              ...Array.from({ length: 9 }).map((_, i) => ({
                slug: `mock-rule-${i}`,
                weight: 1,
              })),
              { slug: 'react-jsx-key', weight: 1 },
            ],
          },
        ],
      },
    ],
  } as Report;

  it('should calculate correct impact for audit in group', () => {
    expect(calculateGroupImpact(mockCategoryRef, mockAudit, mockReport)).toBe(
      0.1,
    );
  });
});
