import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type AuditOutputs, DEFAULT_PERSIST_CONFIG } from '@code-pushup/models';
import { createRunnerFunction } from './runner.js';

describe('createRunnerFunction', () => {
  it('should successfully execute runner', async () => {
    const runner = createRunnerFunction({
      reports: [
        path.join(
          fileURLToPath(path.dirname(import.meta.url)),
          '..',
          '..',
          '..',
          'mocks',
          'single-record-lcov.info',
        ),
      ],
      coverageTypes: ['line'],
      continueOnCommandFail: true,
    });

    await expect(
      runner({ persist: DEFAULT_PERSIST_CONFIG }),
    ).resolves.toStrictEqual([
      {
        slug: 'line-coverage',
        score: 0.7,
        value: 70,
        displayValue: '70 %',
        details: {
          trees: [
            {
              type: 'coverage',
              title: 'Line coverage',
              root: {
                name: '.',
                values: { coverage: 0.7 },
                children: [
                  {
                    name: 'src',
                    values: { coverage: 0.7 },
                    children: [
                      {
                        name: 'lib',
                        values: { coverage: 0.7 },
                        children: [
                          {
                            name: 'utils.ts',
                            values: {
                              coverage: 0.7,
                              missing: [{ startLine: 7, endLine: 9 }],
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
    ] satisfies AuditOutputs);
  });
});
