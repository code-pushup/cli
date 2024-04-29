import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { AuditOutput, Issue } from '@code-pushup/models';
import { normalizeAuditOutputs, normalizeIssue } from './normalize';

vi.mock('@code-pushup/utils', async () => {
  const actual = await vi.importActual('@code-pushup/utils');

  return {
    ...actual,
    gitRoot: vi.fn().mockResolvedValue('/User/code-pushup'),
  };
});

describe('normalizeAuditOutputs', () => {
  it('should forward empty auditOutputs', async () => {
    await expect(normalizeAuditOutputs([])).resolves.toEqual([]);
  });

  it('should forward audits without details', async () => {
    const audit = { slug: 'no-any' } as AuditOutput;
    const outputs = await normalizeAuditOutputs([audit]);
    expect(outputs.at(0)).toBe(audit);
  });

  it('should forward audit details with table', async () => {
    const outputs = await normalizeAuditOutputs([
      { details: { table: {} } } as unknown as AuditOutput,
    ]);
    expect(outputs.at(0)).toStrictEqual({ details: { table: {} } });
  });

  it('should forward audit details without issues', async () => {
    const outputs = await normalizeAuditOutputs([
      { details: { issues: undefined } } as unknown as AuditOutput,
    ]);
    expect(outputs.at(0)).toStrictEqual({ details: { issues: undefined } });
  });

  it('should forward audit details with empty issues', async () => {
    const outputs = await normalizeAuditOutputs([
      { details: { issues: [] } } as unknown as AuditOutput,
    ]);
    expect(outputs.at(0)).toStrictEqual({ details: { issues: [] } });
  });

  it('should forward audit details with issues and all undefined source', async () => {
    const issues = [
      { source: undefined },
      { source: undefined },
      { source: undefined },
    ];
    const outputs = await normalizeAuditOutputs([
      { details: { issues } } as unknown as AuditOutput,
    ]);
    expect(outputs.at(0)?.details?.issues).toBe(issues);
  });

  it('should clone audit details with issues that have source specified', async () => {
    const issues = [
      { source: undefined },
      { source: { file: 'index.js' } },
      { source: undefined },
    ] as Issue[];
    await expect(
      normalizeAuditOutputs([
        { details: { issues } } as unknown as AuditOutput,
      ]),
    ).resolves.toStrictEqual([
      {
        details: {
          issues: [
            { source: undefined },
            { source: { file: 'index.js' } },
            { source: undefined },
          ],
        },
      },
    ]);
  });
});

describe('normalizeIssue', () => {
  it('should forward issue without a source', () => {
    const issue = {
      message: 'file too big',
      severity: 'error',
    } as Issue;
    expect(normalizeIssue(issue, join('User', 'code-pushup'))).toBe(issue);
  });

  it('should normalize filepath in issue if source file is given', () => {
    expect(
      normalizeIssue(
        {
          message: 'file too big',
          severity: 'error',
          source: {
            file: 'index.js',
          },
        },
        join('User', 'code-pushup'),
      ),
    ).toEqual({
      message: 'file too big',
      severity: 'error',
      source: {
        file: expect.stringMatching('index.js'),
      },
    });
  });
});
