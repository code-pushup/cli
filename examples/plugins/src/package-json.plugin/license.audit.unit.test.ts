import { describe, expect, it } from 'vitest';
import { packageJsonName, packageResult } from '../../mocks';
import { licenseAudit } from './license.audit';

describe('licenseAudit', () => {
  const baseAuditOutput = {
    slug: 'package-license',
    score: 1,
    value: 0,
    displayValue: '0 packages',
  };
  const baseErrorAuditOutput = {
    ...baseAuditOutput,
    score: 0,
    value: 1,
    displayValue: `1 package`,
  };

  it('should return passing audit for empty file base results', async () => {
    await expect(licenseAudit([], 'MIT')).resolves.toEqual(baseAuditOutput);
  });

  it('should return passing audit for license configuration missing', async () => {
    await expect(
      licenseAudit(
        [
          packageResult({
            license: 'MIT',
          }),
        ],
        undefined,
      ),
    ).resolves.toEqual({
      ...baseAuditOutput,
      displayValue: `No license required`,
    });
  });

  it('should return error audit for undefined license property', async () => {
    await expect(licenseAudit([packageResult({})], 'MIT')).resolves.toEqual({
      ...baseErrorAuditOutput,
      details: {
        issues: [
          {
            message: 'License should be MIT. It is undefined',
            severity: 'error',
            source: {
              file: expect.stringContaining(packageJsonName),
            },
          },
        ],
      },
    });
  });

  it('should return audit for empty license property', async () => {
    await expect(
      licenseAudit(
        [
          packageResult({
            license: '',
          }),
        ],
        'MIT',
      ),
    ).resolves.toEqual({
      ...baseErrorAuditOutput,
      details: {
        issues: [
          {
            message: 'License should be MIT. It is ',
            severity: 'error',
            source: {
              file: expect.stringContaining(packageJsonName),
            },
          },
        ],
      },
    });
  });

  it('should return audit for different license property', async () => {
    await expect(
      licenseAudit(
        [
          packageResult({
            license: 'CC',
          }),
        ],
        'MIT',
      ),
    ).resolves.toEqual({
      ...baseErrorAuditOutput,
      details: {
        issues: [
          {
            message: 'License should be MIT. It is CC',
            severity: 'error',
            source: {
              file: expect.stringContaining(packageJsonName),
            },
          },
        ],
      },
    });
  });
});
