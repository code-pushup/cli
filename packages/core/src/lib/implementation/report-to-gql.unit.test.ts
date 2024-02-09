import { describe } from 'vitest';
import { issueToGQL } from './report-to-gql';

describe('issueToGQL', () => {
  it('transforms issue to GraphQL input type', () => {
    expect(
      issueToGQL({
        message: 'No let, use const instead.',
        severity: 'error',
        source: {
          file: 'cli.ts',
          position: { startLine: 5, startColumn: 10, endColumn: 25 },
        },
      }),
    ).toStrictEqual({
      message: 'No let, use const instead.',
      severity: 'Error',
      sourceType: 'SourceCode',
      sourceFilePath: 'cli.ts',
      sourceStartLine: 5,
      sourceStartColumn: 10,
      sourceEndLine: undefined,
      sourceEndColumn: 25,
    });
  });
});
