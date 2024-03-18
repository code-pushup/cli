import { describe, expect, it } from 'vitest';
import type { AuditOutput, Issue } from '@code-pushup/models';
import { defaultAuditLevelMapping } from '../../constants';
import {
  auditResultToAuditOutput,
  calculateAuditScore,
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
      displayValue: '0 vulnerabilities',
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
      displayValue: '1 vulnerability (1 critical)',
      details: {
        issues: [
          {
            message: expect.stringContaining(
              '`request` dependency has a **critical** vulnerability',
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
              critical: 0,
              high: 2,
              moderate: 1,
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
      score: 0.75,
      value: 3,
      displayValue: '3 vulnerabilities (2 high, 1 moderate)',
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

describe('calculateAuditScore', () => {
  it('should calculate perfect score for no vulnerabilities', () => {
    expect(
      calculateAuditScore({
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0,
        total: 0,
      }),
    ).toBe(1);
  });

  it('should return zero score for critical vulnerability', () => {
    expect(
      calculateAuditScore({
        critical: 1,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0,
        total: 1,
      }),
    ).toBe(0);
  });

  it('should reduce score based on vulnerability level', () => {
    expect(
      calculateAuditScore({
        critical: 0,
        high: 2, // -0.2
        moderate: 2, // -0.1
        low: 5, // -0.1
        info: 10, // -0.1
        total: 19,
      }),
    ).toBeCloseTo(0.5);
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
    ).toBe('0 vulnerabilities');
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
    ).toBe('6 vulnerabilities (1 critical, 2 moderate, 3 info)');
  });
});

describe('vulnerabilitiesToIssues', () => {
  it('should provide a vulnerability summary', () => {
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
        message:
          '`verdaccio` dependency has a **high** vulnerability in versions **<=5.28.0**. Fix is available.',

        severity: 'error',
      },
    ]);
  });

  it('should provide detailed fix information when available', () => {
    expect(
      vulnerabilitiesToIssues(
        {
          '@cypress/request': {
            name: '@cypress/request',
            severity: 'moderate',
            fixAvailable: {
              name: 'cypress',
              version: '13.7.0',
              isSemVerMajor: true,
            },
            range: '<=2.88.12',
            via: ['cypress'],
          },
        },
        defaultAuditLevelMapping,
      ),
    ).toEqual<Issue[]>([
      {
        message: expect.stringContaining(
          'Fix available: Update `cypress` to version **13.7.0** (breaking change).',
        ),
        severity: 'warning',
      },
    ]);
  });

  it('should include vulnerability title and URL when provided', () => {
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
        message: expect.stringContaining(
          'More information: [tough-cookie Prototype Pollution vulnerability](https://github.com/advisories/GHSA-72xf-g2v4-qvf3)',
        ),
        severity: 'warning',
      },
    ]);
  });

  it('should correctly map vulnerability level to issue severity', () => {
    expect(
      vulnerabilitiesToIssues(
        {
          verdaccio: {
            name: 'verdaccio',
            severity: 'high',
            fixAvailable: true,
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

  it('should translate any version range to human-friendly summary', () => {
    expect(
      vulnerabilitiesToIssues(
        {
          verdaccio: {
            name: 'verdaccio',
            severity: 'high',
            fixAvailable: false,
            range: '*',
            via: ['request'],
          },
        },
        defaultAuditLevelMapping,
      ),
    ).toEqual<Issue[]>([
      {
        message: expect.stringContaining('vulnerability in **all** versions'),
        severity: 'error',
      },
    ]);
  });

  it('should return empty array for no vulnerabilities', () => {
    expect(vulnerabilitiesToIssues({}, defaultAuditLevelMapping)).toEqual([]);
  });
});
