import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type { AuditOutput, Issue } from '@code-pushup/models';
import { normalizeAuditOutputs, normalizeIssue } from './normalize';

vi.mock('@code-pushup/utils', async () => {
  const actual = await vi.importActual('@code-pushup/utils');

  return {
    ...actual,
    getGitRoot: vi.fn().mockResolvedValue('/Users/user/Projects/myProject'),
  };
});

describe('normalizeAuditOutputs', () => {
  it('should forward empty auditOutputs', async () => {
    await expect(normalizeAuditOutputs([])).resolves.toEqual([]);
  });

  it('should forward audits without details', async () => {
    await expect(
      normalizeAuditOutputs([{ slug: 'no-any' } as AuditOutput]),
    ).resolves.toEqual([{ slug: 'no-any' }]);
  });

  it('should forward audit details with table', async () => {
    const audit = { details: { table: {} } } as AuditOutput;
    const outputs = await normalizeAuditOutputs([audit]);
    expect(outputs.at(0)).toBe(audit);
  });

  it('should forward audit details without issues', async () => {
    const audit = { details: { issues: undefined } } as AuditOutput;
    const outputs = await normalizeAuditOutputs([audit]);
    expect(outputs.at(0)).toBe(audit);
  });

  it('should forward audit details with empty issues', async () => {
    const audit = { details: { issues: [] as Issue[] } } as AuditOutput;
    const outputs = await normalizeAuditOutputs([audit]);
    expect(outputs.at(0)).toBe(audit);
  });

  it('should forward audit details with issues and all undefined source', async () => {
    const audit = {
      details: {
        issues: [
          { source: undefined },
          { source: undefined },
          { source: undefined },
        ],
      },
    } as AuditOutput;
    const outputs = await normalizeAuditOutputs([audit]);
    expect(outputs.at(0)?.details?.issues).toBe(audit.details?.issues);
  });

  it('should normalize audit details with issues that have a source specified', async () => {
    const path = '/Users/user/Projects/myProject/utils/index.js';
    const issues = [
      { source: undefined },
      { source: { file: path } },
      { source: undefined },
    ] as Issue[];
    await expect(
      normalizeAuditOutputs([{ details: { issues } } as AuditOutput]),
    ).resolves.toStrictEqual([
      {
        details: {
          issues: [
            { source: undefined },
            { source: { file: 'utils/index.js' } },
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
    const path = '/myProject/utils/index.js';
    const gitRoot = '/myProject';
    expect(
      normalizeIssue(
        {
          message: 'file too big',
          severity: 'error',
          source: {
            file: path,
          },
        },
        gitRoot,
      ),
    ).toEqual({
      message: 'file too big',
      severity: 'error',
      source: {
        file: 'utils/index.js',
      },
    });
  });
});
