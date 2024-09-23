import { describe, expect, it } from 'vitest';
import type { AuditResult } from '../../runner/audit/types';
import { pnpmToAuditResult, pnpmToDirectDependency } from './audit-result';
import type { PnpmAuditResultJson } from './types';

describe('pnpmToAuditResult', () => {
  it('should transform PNPM audit to unified audit result', () => {
    expect(
      pnpmToAuditResult(
        JSON.stringify({
          advisories: {
            '123': {
              module_name: '@cypress/request',
              id: 123,
              severity: 'high',
              vulnerable_versions: '<2.88.12',
              recommendation: 'Upgrade to version 2.88.12 or later',
              title: 'SSR forgery',
              url: 'https://github.com/advisories',
              findings: [{ paths: ['. > @cypress/request@2.88.5'] }],
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
        } satisfies PnpmAuditResultJson),
      ),
    ).toEqual<AuditResult>({
      vulnerabilities: [
        {
          name: '@cypress/request',
          id: 123,
          severity: 'high',
          versionRange: '<2.88.12',
          fixInformation: 'Upgrade to version 2.88.12 or later',
          directDependency: true,
          title: 'SSR forgery',
          url: 'https://github.com/advisories',
        },
      ],
      summary: {
        critical: 0,
        high: 1,
        moderate: 0,
        low: 0,
        info: 0,
        total: 1,
      },
    });
  });

  it('should return empty result for no vulnerabilities', () => {
    expect(
      pnpmToAuditResult(
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
        } satisfies PnpmAuditResultJson),
      ),
    ).toStrictEqual({
      vulnerabilities: [],
      summary: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
    });
  });

  it('should filter out warnings from the input', () => {
    /* eslint-disable no-irregular-whitespace */
    const inputWithWarnings = `
       WARN  Unsupported engine
       WARN  Issue while reading file
      {
        "advisories": {
          "123": {
            "module_name": "@cypress/request",
            "id": 123,
            "severity": "high",
            "vulnerable_versions": "<2.88.12",
            "recommendation": "Upgrade to version 2.88.12 or later",
            "title": "SSR forgery",
            "url": "https://github.com/advisories",
            "findings": [
              { "paths": [". > @cypress/request@2.88.5"] }
            ]
          }
        },
        "metadata": {
          "vulnerabilities": {
            "critical": 0,
            "high": 1,
            "moderate": 0,
            "low": 0,
            "info": 0
          }
        }
      }
    `;
    /* eslint-enable no-irregular-whitespace */
    expect(pnpmToAuditResult(inputWithWarnings)).toEqual<AuditResult>({
      vulnerabilities: [
        {
          name: '@cypress/request',
          id: 123,
          severity: 'high',
          versionRange: '<2.88.12',
          fixInformation: 'Upgrade to version 2.88.12 or later',
          directDependency: true,
          title: 'SSR forgery',
          url: 'https://github.com/advisories',
        },
      ],
      summary: {
        critical: 0,
        high: 1,
        moderate: 0,
        low: 0,
        info: 0,
        total: 1,
      },
    });
  });
});

describe('pnpmToDirectDependency', () => {
  it('should identify a direct dependency', () => {
    expect(pnpmToDirectDependency('. > semver@7.0.0')).toBe(true);
  });

  it('should return a direct dependency name', () => {
    expect(
      pnpmToDirectDependency('. > cypress@4.3.0 > @cypress/request@2.88.5"'),
    ).toBe('cypress');
  });
});
