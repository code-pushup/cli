import { describe, expect, it } from 'vitest';
import type { AuditResult } from '../../runner/audit/types.js';
import { yarnv2ToAuditResult } from './audit-result.js';
import type { Yarnv2AuditResultJson } from './types.js';

describe('yarnv2ToAuditResult', () => {
  it('should transform Yarn v2 audit to unified audit result', () => {
    expect(
      yarnv2ToAuditResult(
        JSON.stringify({
          advisories: {
            '123': {
              module_name: 'nx',
              severity: 'high',
              title: 'DoS',
              url: 'https://github.com/advisories',
              recommendation: 'Update nx to 17.0.0',
              vulnerable_versions: '<17.0.0',
              findings: [{ paths: ['nx'] }],
            },
          },
          metadata: {
            vulnerabilities: {
              critical: 0,
              high: 1,
              moderate: 0,
              low: 0,
              info: 0,
            },
          },
        } satisfies Yarnv2AuditResultJson),
      ),
    ).toEqual<AuditResult>({
      vulnerabilities: [
        {
          name: 'nx',
          severity: 'high',
          title: 'DoS',
          url: 'https://github.com/advisories',
          fixInformation: 'Update nx to 17.0.0',
          versionRange: '<17.0.0',
          directDependency: true,
        },
      ],
      summary: { critical: 0, high: 1, moderate: 0, low: 0, info: 0, total: 1 },
    });
  });

  it('should return empty report if no vulnerabilities found', () => {
    expect(
      yarnv2ToAuditResult(
        JSON.stringify({
          advisories: {},
          metadata: {
            vulnerabilities: {
              critical: 0,
              high: 0,
              moderate: 0,
              low: 0,
              info: 0,
            },
          },
        }),
      ),
    ).toStrictEqual({
      vulnerabilities: [],
      summary: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
    });
  });
});
