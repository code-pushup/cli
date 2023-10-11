import type { AuditOutput } from '@code-pushup/models';
import { lintResultsToAudits } from './transform';
import type { LintResult } from './types';

describe('lintResultsToAudits', () => {
  it('should convert ESLint results with custom options to Code PushUp audits', () => {
    expect(
      lintResultsToAudits({
        results: [
          {
            filePath: `${process.cwd()}/src/app/app.component.ts`,
            relativeFilePath: 'src/app/app.component.ts',
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
            filePath: `${process.cwd()}/src/app/app.component.spec.ts`,
            relativeFilePath: 'src/app/app.component.spec.ts',
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
            filePath: `${process.cwd()}/src/app/pages/settings.component.ts`,
            relativeFilePath: 'src/app/pages/settings.component.ts',
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
        ] as LintResult[],
        ruleOptionsPerFile: {
          'src/app/app.component.ts': {
            'max-lines': [500],
            '@typescript-eslint/no-explicit-any': [],
          },
          'src/app/pages/settings.component.ts': {
            'max-lines': [500],
          },
          'src/app/app.component.spec.ts': {
            'max-lines': [800],
            '@typescript-eslint/no-explicit-any': [],
          },
        },
      }),
    ).toEqual([
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
    ] satisfies AuditOutput[]);
  });
});
