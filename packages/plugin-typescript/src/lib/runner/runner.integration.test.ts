import { describe, expect } from 'vitest';
import { createRunnerFunction } from './runner.js';

describe('createRunnerFunction', () => {
  it('should create valid runner function', async () => {
    await expect(
      createRunnerFunction({
        tsConfigPath:
          'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.json',
        expectedAudits: [{ slug: 'no-implicit-any' }],
      })(() => void 0),
    ).resolves.toStrictEqual([
      {
        details: {
          issues: [
            {
              message: "Parameter 'param' implicitly has an 'any' type.",
              severity: 'error',
              source: {
                file: 'packages/plugin-typescript/mocks/fixtures/basic-setup/src/ts-7006-no-implicit-any.ts',
                position: {
                  startLine: 8,
                },
              },
            },
          ],
        },
        score: 0,
        slug: 'no-implicit-any',
        value: 1,
      },
    ]);
  });
});
