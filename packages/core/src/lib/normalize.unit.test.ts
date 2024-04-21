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
    expect(outputs.at(0)).toStrictEqual({ details: {} });
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

  it('should clone audit details with issues NOT all undefined source', async () => {
    const issues = [
      { source: undefined },
      { source: 'index.js' },
      { source: undefined },
    ];
    await expect(
      normalizeAuditOutputs([
        { details: { issues } } as unknown as AuditOutput,
      ]),
    ).rejects.toThrow(
      'The "path" argument must be of type string. Received undefined',
    );
  });
});

describe('normalizeIssue', () => {
  it('should forward issue if source == null', () => {
    const issue = {
      message: 'file too big',
      severity: 'error',
    } as Issue;
    expect(normalizeIssue(issue, '/User/code-pushup')).toBe(issue);
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
        file: join('..', '..', 'index.js'),
      },
    });
  });
});
