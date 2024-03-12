import { describe, expect, it } from 'vitest';
import type { AuditOutput, Issue } from '@code-pushup/models';
import { defaultAuditLevelMapping } from '../../constants';
import {
  auditResultToAuditOutput,
  vulnerabilitiesToDisplayValue,
  vulnerabilitiesToIssues,
} from './transform';
import { Vulnerability } from './types';

describe('auditResultToAuditOutput', () => {
  it('should return audit output with no vulnerabilities', () => {
    expect(
      auditResultToAuditOutput(
        {
          vulnerabilities: {},
          metadata: {
            vulnerabilities: {
              critical: 0,
              high: 0,
              moderate: 0,
              low: 0,
              info: 0,
              total: 0,
            },
          },
        },
        'prod',
        defaultAuditLevelMapping,
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-audit-prod',
      score: 1,
      value: 0,
      displayValue: 'passed',
    });
  });

  it('should return audit output with a vulnerability', () => {
    expect(
      auditResultToAuditOutput(
        {
          vulnerabilities: {
            request: {
              name: 'request',
              severity: 'critical',
              range: '2.0.0 - 3.0.0',
              via: [
                { title: 'SSR forgery', url: 'https://github.com/advisories/' },
              ],
              fixAvailable: false,
            },
          },
          metadata: {
            vulnerabilities: {
              critical: 1,
              high: 0,
              moderate: 0,
              low: 0,
              info: 0,
              total: 1,
            },
          },
        },
        'prod',
        defaultAuditLevelMapping,
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-audit-prod',
      score: 0,
      value: 1,
      displayValue: '1 critical vulnerability',
      details: {
        issues: [
          {
            message: expect.stringContaining(
              'request dependency has a vulnerability "SSR forgery"',
            ),
            severity: 'error',
          },
        ],
      },
    });
  });

  it('should return audit output with multiple vulnerabilities', () => {
    expect(
      auditResultToAuditOutput(
        {
          vulnerabilities: {
            request: {
              name: 'request',
              severity: 'critical',
              range: '2.0.0 - 3.0.0',
              via: [
                { title: 'SSR forgery', url: 'https://github.com/advisories/' },
              ],
              fixAvailable: false,
            },
            '@babel/traverse': {
              name: '@babel/traverse',
              severity: 'high',
              range: '<7.23.2',
              via: [
                {
                  title: 'Malicious code execution',
                  url: 'https://github.com/advisories/',
                },
              ],
              fixAvailable: true,
            },
            verdaccio: {
              name: 'verdaccio',
              severity: 'critical',
              range: '*',
              via: ['request'],
              fixAvailable: true,
            },
          },
          metadata: {
            vulnerabilities: {
              critical: 2,
              high: 1,
              moderate: 0,
              low: 0,
              info: 0,
              total: 3,
            },
          },
        },
        'dev',
        defaultAuditLevelMapping,
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-audit-dev',
      score: 0,
      value: 3,
      displayValue: '2 critical, 1 high vulnerabilities',
      details: {
        issues: [
          expect.objectContaining({
            message: expect.stringContaining('request'),
          }),
          expect.objectContaining({
            message: expect.stringContaining('@babel/traverse'),
          }),
          expect.objectContaining({
            message: expect.stringContaining('verdaccio'),
          }),
        ],
      },
    });
  });
});

describe('vulnerabilitiesToDisplayValue', () => {
  it('should return passed for no vulnerabilities', () => {
    expect(
      vulnerabilitiesToDisplayValue({
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0,
        total: 0,
      }),
    ).toBe('passed');
  });

  it('should return a summary of vulnerabilities', () => {
    expect(
      vulnerabilitiesToDisplayValue({
        critical: 1,
        high: 0,
        moderate: 2,
        low: 0,
        info: 3,
        total: 6,
      }),
    ).toBe('1 critical, 2 moderate, 3 info vulnerabilities');
  });
});

describe('vulnerabilitiesToIssues', () => {
  it('should create an issue with a vulnerability URL based on provided vulnerability', () => {
    expect(
      vulnerabilitiesToIssues(
        {
          'tough-cookie': {
            name: 'tough-cookie',
            severity: 'moderate',
            fixAvailable: true,
            range: '<4.1.3',
            via: [
              {
                title: 'tough-cookie Prototype Pollution vulnerability',
                url: 'https://github.com/advisories/GHSA-72xf-g2v4-qvf3',
              },
            ],
          },
        },
        defaultAuditLevelMapping,
      ),
    ).toEqual<Issue[]>([
      {
        message: expect.stringMatching(
          /tough-cookie dependency has a vulnerability "tough-cookie Prototype Pollution vulnerability" for versions <4.1.3.* More information.*https:\/\/github\.com\/advisories/,
        ),
        severity: 'warning',
      },
    ]);
  });

  it('should provide shorter message when context is in a different vulnerability', () => {
    expect(
      vulnerabilitiesToIssues(
        {
          verdaccio: {
            name: 'verdaccio',
            severity: 'high',
            fixAvailable: true,
            range: '<=5.28.0',
            via: ['request'],
          },
        },
        defaultAuditLevelMapping,
      ),
    ).toEqual<Issue[]>([
      {
        message: expect.stringMatching(
          /verdaccio dependency has a vulnerability for versions <=5.28.0. Fix is available./,
        ),
        severity: 'error',
      },
    ]);
  });

  it('should correctly map vulnerability level to issue severity', () => {
    expect(
      vulnerabilitiesToIssues(
        {
          verdaccio: {
            severity: 'high',
          } as Vulnerability,
        },
        { ...defaultAuditLevelMapping, high: 'info' },
      ),
    ).toEqual<Issue[]>([
      {
        message: expect.any(String),
        severity: 'info',
      },
    ]);
  });

  it('should return empty array for no vulnerabilities', () => {
    expect(vulnerabilitiesToIssues({}, defaultAuditLevelMapping)).toEqual([]);
  });
});
