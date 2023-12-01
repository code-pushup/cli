import { describe, expect, it } from 'vitest';
import { AuditOutput } from '@code-pushup/models';
import { packageResult } from '../../../mocks/constants';
import { documentationAudit } from './documentation.audit';

describe('documentationAudit', () => {
  const baseAuditOutput: AuditOutput = {
    slug: 'package-documentation',
    score: 1,
    value: 0,
    displayValue: '0 packages',
  };

  it('should list valid dependencies as informative issue', async () => {
    await expect(
      documentationAudit([packageResult()], {
        description: true,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        ...baseAuditOutput,
        details: {
          issues: [
            {
              message: 'Package lib1@0.0.0 is installed as dependencies.',
              severity: 'info',
              source: {
                file: 'package.json',
              },
            },
          ],
        },
      }),
    );
  });
});
