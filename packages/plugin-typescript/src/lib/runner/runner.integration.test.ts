import { describe, expect } from 'vitest';
import { getAudits } from '../utils.js';
import { createRunnerFunction } from './runner.js';

describe('createRunnerFunction', () => {
  it('should create valid runner function', async () => {
    await expect(
      createRunnerFunction({
        tsConfigPath:
          'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.json',
        expectedAudits: getAudits(),
      })(() => void 0),
    ).resolves.toStrictEqual([
      { slug: 'syntax-errors', score: 1, value: 0 },
      {
        slug: 'semantic-errors',
        score: 0,
        value: 4,
        details: {
          issues: [
            {
              message:
                "TS2307: Cannot find module './non-existent' or its corresponding type declarations.",
              severity: 'error',
              source: {
                file: expect.stringContaining('ts-2307-module-not-fount.ts'),
                position: { startLine: 2 },
              },
            },
            {
              message:
                "TS2683: 'this' implicitly has type 'any' because it does not have a type annotation.",
              severity: 'error',
              source: {
                file: expect.stringContaining('ts-2683-not-implicit-this.ts'),
                position: { startLine: 3 },
              },
            },
            {
              message: expect.stringContaining(
                'TS2349: This expression is not callable.',
              ),
              severity: 'error',
              source: {
                file: expect.stringContaining('ts-2349-not-callable.ts'),
                position: { startLine: 3 },
              },
            },
            {
              message:
                "TS2322: Type 'null' is not assignable to type 'string'.",
              severity: 'error',
              source: {
                file: expect.stringContaining('ts-2531-strict-null-checks.ts'),
                position: { startLine: 2 },
              },
            },
          ],
        },
      },
      { slug: 'suggestions', score: 1, value: 0 },
      { slug: 'language-service-errors', score: 1, value: 0 },
      { slug: 'internal-errors', score: 1, value: 0 },
      { slug: 'configuration-errors', score: 1, value: 0 },
      { slug: 'unknown-codes', score: 1, value: 0 },
    ]);
  });
});
