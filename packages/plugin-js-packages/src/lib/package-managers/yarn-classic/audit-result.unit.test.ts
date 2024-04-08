import { describe, expect, it } from 'vitest';
import { toJsonLines } from '@code-pushup/utils';
import { AuditResult } from '../../runner/audit/types';
import { yarnv1ToAuditResult } from './audit-result';
import { Yarnv1AuditAdvisory, Yarnv1AuditSummary } from './types';

describe('yarnv1ToAuditResult', () => {
  it('should transform Yarn v1 audit to unified audit result', () => {
    const advisory = {
      type: 'auditAdvisory',
      data: {
        resolution: { path: 'docs>semver', id: 123 },
        advisory: {
          module_name: 'semver',
          severity: 'moderate',
          vulnerable_versions: '<5.7.2',
          recommendation: 'Upgrade to version 5.7.2 or later',
          title: 'DoS',
          url: 'https://github.com/advisories',
        },
      },
    } satisfies Yarnv1AuditAdvisory;
    const summary = {
      type: 'auditSummary',
      data: {
        vulnerabilities: {
          critical: 0,
          high: 0,
          moderate: 1,
          low: 0,
          info: 0,
        },
      },
    } satisfies Yarnv1AuditSummary;

    expect(
      yarnv1ToAuditResult(toJsonLines([advisory, summary])),
    ).toEqual<AuditResult>({
      vulnerabilities: [
        {
          name: 'semver',
          severity: 'moderate',
          id: 123,
          versionRange: '<5.7.2',
          fixInformation: 'Upgrade to version 5.7.2 or later',
          directDependency: 'docs',
          title: 'DoS',
          url: 'https://github.com/advisories',
        },
      ],
      summary: { critical: 0, high: 0, moderate: 1, low: 0, info: 0, total: 1 },
    });
  });

  it('should throw for no audit summary', () => {
    const advisory = {
      data: {},
      type: 'auditAdvisory',
    };
    expect(() => yarnv1ToAuditResult(toJsonLines([advisory]))).toThrow(
      'no summary found',
    );
  });
});
