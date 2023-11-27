import { describe, expect, it } from 'vitest';
import { AuditOutput } from '@code-pushup/models';
import { packageJsonName, packageResult } from '../../mocks';
import { documentationAudit } from './documentation.audit';

describe('documentationAudit', () => {
  const baseAuditOutput: AuditOutput = {
    slug: 'package-documentation',
    score: 1,
    value: 0,
    displayValue: '0 packages',
  };
  const baseErrorAuditOutput: AuditOutput = {
    ...baseAuditOutput,
    score: 0,
    value: 1,
    displayValue: `1 package`,
  };

  it('should return passing audit for empty file base results', async () => {
    await expect(
      documentationAudit([], {
        description: true,
      }),
    ).resolves.toEqual(baseAuditOutput);
  });

  it.each([[undefined], [{}]])(
    'should return passing audit for documentation configuration missing (value: %s)',
    async docs => {
      await expect(
        documentationAudit([packageResult({})], docs),
      ).resolves.toEqual({
        ...baseAuditOutput,
        displayValue: `No documentation requirements`,
      } satisfies AuditOutput);
    },
  );

  it('should return error audit for undefined description property', async () => {
    await expect(
      documentationAudit([packageResult({})], { description: true }),
    ).resolves.toEqual({
      ...baseErrorAuditOutput,
      details: {
        issues: [
          {
            message: 'Description missing',
            severity: 'error',
            source: {
              file: expect.stringContaining(packageJsonName),
            },
          },
        ],
      },
    } satisfies AuditOutput);
  });

  it('should return audit for empty description property', async () => {
    await expect(
      documentationAudit(
        [
          packageResult({
            description: '',
          }),
        ],
        { description: true },
      ),
    ).resolves.toEqual({
      ...baseErrorAuditOutput,
      details: {
        issues: [
          {
            message: 'Description empty',
            severity: 'error',
            source: {
              file: expect.stringContaining(packageJsonName),
              position: {
                startLine: 2,
              },
            },
          },
        ],
      },
    });
  });
});
