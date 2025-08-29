import type { ESLint } from 'eslint';
import type { AuditOutput } from '@code-pushup/models';
import { lintResultsToAudits } from './transform.js';

describe('lintResultsToAudits', () => {
  it('should convert ESLint results with custom options to Code PushUp audits', () => {
    expect(
      lintResultsToAudits({
        results: [
          {
            filePath: 'src/app/app.component.ts',
            messages: [
              {
                ruleId: 'max-lines',
                message:
                  'File has too many lines (614). Maximum allowed is 500.',
                severity: 1,
                line: 501,
                column: 1,
              },
              {
                ruleId: '@typescript-eslint/no-explicit-any',
                message: 'Unexpected any. Specify a different type.',
                severity: 2,
                line: 312,
                column: 11,
                endLine: 312,
                endColumn: 14,
              },
              {
                ruleId: '@typescript-eslint/no-explicit-any',
                message: 'Unexpected any. Specify a different type.',
                severity: 2,
                line: 481,
                column: 13,
                endLine: 481,
                endColumn: 16,
              },
            ],
          },
          {
            filePath: 'src/app/app.component.spec.ts',
            messages: [
              {
                ruleId: 'max-lines',
                message:
                  'File has too many lines (826). Maximum allowed is 800.',
                severity: 1,
                line: 801,
                column: 1,
              },
              {
                ruleId: '@typescript-eslint/no-explicit-any',
                message: 'Unexpected any. Specify a different type.',
                severity: 1,
                line: 88,
                column: 16,
                endLine: 88,
                endColumn: 19,
              },
            ],
          },
          {
            filePath: 'src/app/graphql/generated.ts',
            messages: [
              {
                ruleId: 'unicorn/no-abusive-eslint-disable',
                message: 'Specify the rules you want to disable',
                severity: 1,
                line: 1,
                column: 0,
              },
            ],
          },
          {
            filePath: 'src/app/test/strictNullChecks.ts',
            messages: [
              {
                ruleId: '@typescript-eslint/prefer-nullish-coalescing',
                message:
                  'This rule requires the strictNullChecks compiler option to be turned on to function correctly',
                severity: 1,
                line: 0,
                column: 1,
              },
            ],
          },
          {
            filePath: 'src/app/pages/settings.component.ts',
            messages: [
              {
                ruleId: 'max-lines',
                message:
                  'File has too many lines (504). Maximum allowed is 500.',
                severity: 1,
                line: 501,
                column: 1,
              },
            ],
          },
        ] as ESLint.LintResult[],
        ruleOptionsPerFile: {
          'src/app/app.component.ts': {
            'max-lines': [500],
            '@typescript-eslint/no-explicit-any': [],
            '@typescript-eslint/prefer-nullish-coalescing': [],
            'unicorn/no-abusive-eslint-disable': [],
          },
          'src/app/pages/settings.component.ts': {
            'max-lines': [500],
            '@typescript-eslint/no-explicit-any': [],
            '@typescript-eslint/prefer-nullish-coalescing': [],
            'unicorn/no-abusive-eslint-disable': [],
          },
          'src/app/graphql/generated.ts': {
            'max-lines': [500],
            '@typescript-eslint/no-explicit-any': [],
            '@typescript-eslint/prefer-nullish-coalescing': [],
            'unicorn/no-abusive-eslint-disable': [],
          },
          'src/app/app.component.spec.ts': {
            'max-lines': [800],
            '@typescript-eslint/no-explicit-any': [],
            '@typescript-eslint/prefer-nullish-coalescing': [],
            'unicorn/no-abusive-eslint-disable': [],
          },
        },
      }),
    ).toEqual<AuditOutput[]>([
      {
        slug: expect.stringContaining('max-lines'),
        score: 0,
        value: 2,
        displayValue: '2 warnings',
        details: {
          issues: [
            {
              message: 'File has too many lines (614). Maximum allowed is 500.',
              severity: 'warning',
              source: {
                file: 'src/app/app.component.ts',
                position: { startLine: 501, startColumn: 1 },
              },
            },
            {
              message: 'File has too many lines (504). Maximum allowed is 500.',
              severity: 'warning',
              source: {
                file: 'src/app/pages/settings.component.ts',
                position: { startLine: 501, startColumn: 1 },
              },
            },
          ],
        },
      },
      {
        slug: 'typescript-eslint-no-explicit-any',
        score: 0,
        value: 3,
        displayValue: '2 errors, 1 warning',
        details: {
          issues: [
            {
              message: 'Unexpected any. Specify a different type.',
              severity: 'error',
              source: {
                file: 'src/app/app.component.ts',
                position: {
                  startLine: 312,
                  startColumn: 11,
                  endLine: 312,
                  endColumn: 14,
                },
              },
            },
            {
              message: 'Unexpected any. Specify a different type.',
              severity: 'error',
              source: {
                file: 'src/app/app.component.ts',
                position: {
                  startLine: 481,
                  startColumn: 13,
                  endLine: 481,
                  endColumn: 16,
                },
              },
            },
            {
              message: 'Unexpected any. Specify a different type.',
              severity: 'warning',
              source: {
                file: 'src/app/app.component.spec.ts',
                position: {
                  startLine: 88,
                  startColumn: 16,
                  endLine: 88,
                  endColumn: 19,
                },
              },
            },
          ],
        },
      },
      {
        slug: expect.stringContaining('max-lines'),
        score: 0,
        value: 1,
        displayValue: '1 warning',
        details: {
          issues: [
            {
              message: 'File has too many lines (826). Maximum allowed is 800.',
              severity: 'warning',
              source: {
                file: 'src/app/app.component.spec.ts',
                position: { startLine: 801, startColumn: 1 },
              },
            },
          ],
        },
      },
      {
        slug: 'unicorn-no-abusive-eslint-disable',
        score: 0,
        value: 1,
        displayValue: '1 warning',
        details: {
          issues: [
            {
              message: 'Specify the rules you want to disable',
              severity: 'warning',
              source: {
                file: 'src/app/graphql/generated.ts',
                position: { startLine: 1 },
              },
            },
          ],
        },
      },
      {
        slug: 'typescript-eslint-prefer-nullish-coalescing',
        score: 0,
        value: 1,
        displayValue: '1 warning',
        details: {
          issues: [
            {
              message:
                'This rule requires the strictNullChecks compiler option to be turned on to function correctly',
              severity: 'warning',
              source: {
                file: 'src/app/test/strictNullChecks.ts',
              },
            },
          ],
        },
      },
    ]);
  });
});
