import { type Issue, issueSchema } from './issue.js';

describe('issueSchema', () => {
  it('should accept a valid issue without source file information', () => {
    expect(() =>
      issueSchema.parse({
        message: 'Do not use console.log()',
        severity: 'error',
      } satisfies Issue),
    ).not.toThrow();
  });

  it('should accept a valid issue with source file information', () => {
    expect(() =>
      issueSchema.parse({
        message: 'Use const instead of let.',
        severity: 'error',
        source: {
          file: 'my/code/index.ts',
          position: { startLine: 1, startColumn: 4, endLine: 1, endColumn: 10 },
        },
      } satisfies Issue),
    ).not.toThrow();
  });

  it('should throw for a missing message', () => {
    expect(() =>
      issueSchema.parse({
        severity: 'error',
        source: { file: 'my/code/index.ts' },
      }),
    ).toThrow('invalid_type');
  });

  it('should throw for an invalid issue severity', () => {
    expect(() =>
      issueSchema.parse({
        message: 'Use const instead of let.',
        severity: 'critical',
      }),
    ).toThrow(
      String.raw`Invalid option: expected one of \"info\"|\"warning\"|\"error\"`,
    );
  });

  it('should throw for invalid file position', () => {
    expect(() =>
      issueSchema.parse({
        message: 'Use const instead of let.',
        severity: 'warning',
        source: {
          file: 'src/utils.ts',
          position: { startLine: 0, endLine: 3 },
        },
      } satisfies Issue),
    ).toThrow('Too small: expected number to be >0');
  });
});
