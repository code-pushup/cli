import { describe } from 'vitest';
import { Issue } from '@code-pushup/models';
import { issuesToGql } from './json-to-gql';

describe('issuesToGql', () => {
  it('transforms issue to GraphQL query', () => {
    expect(
      issuesToGql([
        {
          message: 'No let, use const instead.',
          severity: 'error',

          source: {
            file: 'cli.ts',
            position: { startLine: 5, startColumn: 10, endColumn: 25 },
          },
        },
      ] as Issue[]),
    ).toStrictEqual([
      {
        message: 'No let, use const instead.',
        severity: 'Error',
        sourceType: 'SourceCode',
        sourceFilePath: 'cli.ts',
        sourceStartLine: 5,
        sourceStartColumn: 10,
        sourceEndLine: undefined,
        sourceEndColumn: 25,
      },
    ]);
  });

  it('returns empty array for no issues', () => {
    expect(issuesToGql([])).toEqual([]);
  });
});
