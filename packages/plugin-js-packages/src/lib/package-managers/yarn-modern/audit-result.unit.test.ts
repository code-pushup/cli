import { describe, expect, it } from 'vitest';
import type { AuditResult } from '../../runner/audit/types.js';
import { yarnBerryToAuditResult } from './audit-result.js';
import type {
  YarnBerry2or3AuditResultJson,
  YarnBerry4AuditVulnerability,
} from './types.js';

describe('yarnBerryToAuditResult', () => {
  it('should transform Yarn v2 audit to unified audit result', () => {
    expect(
      yarnBerryToAuditResult(
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
        } satisfies YarnBerry2or3AuditResultJson),
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

  it('should transform Yarn v4 audit to unified audit result', () => {
    const vulnerabilities: YarnBerry4AuditVulnerability[] = [
      {
        value: 'express',
        children: {
          ID: 1_096_820,
          Issue: 'Express.js Open Redirect in malformed URLs',
          URL: 'https://github.com/advisories/GHSA-rv95-896h-c2vc',
          Severity: 'moderate',
          'Vulnerable Versions': '<4.19.2',
          'Tree Versions': ['3.21.2'],
          Dependents: ['my-project@workspace:.'],
        },
      },
      {
        value: 'send',
        children: {
          ID: 1_100_526,
          Issue: 'send vulnerable to template injection that can lead to XSS',
          URL: 'https://github.com/advisories/GHSA-m6fv-jmcg-4jfg',
          Severity: 'low',
          'Vulnerable Versions': '<0.19.0',
          'Tree Versions': ['0.13.0', '0.13.2'],
          Dependents: ['express@npm:3.21.2', 'serve-static@npm:1.10.3'],
        },
      },
    ];
    expect(
      yarnBerryToAuditResult(
        vulnerabilities
          .map(vulnerability => `${JSON.stringify(vulnerability)}\n`)
          .join(''),
      ),
    ).toEqual<AuditResult>({
      vulnerabilities: [
        {
          name: 'express',
          severity: 'moderate',
          title: 'Express.js Open Redirect in malformed URLs',
          url: 'https://github.com/advisories/GHSA-rv95-896h-c2vc',
          id: 1_096_820,
          versionRange: '<4.19.2',
          directDependency: true,
        },
        {
          name: 'send',
          severity: 'low',
          title: 'send vulnerable to template injection that can lead to XSS',
          url: 'https://github.com/advisories/GHSA-m6fv-jmcg-4jfg',
          id: 1_100_526,
          versionRange: '<0.19.0',
          directDependency: '',
        },
      ],
      summary: { critical: 0, high: 0, moderate: 1, low: 1, info: 0, total: 2 },
    });
  });
});
