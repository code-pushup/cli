import type { AuditOutput, Issue } from '@code-pushup/models';
import { defaultAuditLevelMapping } from '../../constants.js';
import {
  auditResultToAuditOutput,
  calculateAuditScore,
  summaryToDisplayValue,
  vulnerabilitiesToIssues,
} from './transform.js';
import type { Vulnerability } from './types.js';

describe('auditResultToAuditOutput', () => {
  it('should return audit output with no vulnerabilities', () => {
    expect(
      auditResultToAuditOutput(
        {
          vulnerabilities: [],
          summary: {
            critical: 0,
            high: 0,
            moderate: 0,
            low: 0,
            info: 0,
            total: 0,
          },
        },
        'npm',
        'prod',
        defaultAuditLevelMapping,
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-audit-prod',
      score: 1,
      value: 0,
      displayValue: '0 vulnerabilities',
      details: { issues: [] },
    });
  });

  it('should return audit output with a vulnerability', () => {
    expect(
      auditResultToAuditOutput(
        {
          vulnerabilities: [
            {
              name: 'request',
              severity: 'critical',
              versionRange: '2.0.0 - 3.0.0',
              title: 'SSR forgery',
              url: 'https://github.com/advisories/',
              fixInformation: '',
              directDependency: true,
            },
          ],
          summary: {
            critical: 1,
            high: 0,
            moderate: 0,
            low: 0,
            info: 0,
            total: 1,
          },
        },
        'npm',
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
          vulnerabilities: [
            {
              name: 'request',
              severity: 'critical',
              versionRange: '2.0.0 - 3.0.0',
              title: 'SSR forgery',
              url: 'https://github.com/advisories/',
              fixInformation: '',
              directDependency: true,
            },
            {
              name: '@babel/traverse',
              severity: 'high',
              versionRange: '<7.23.2',
              title: 'Malicious code execution',
              url: 'https://github.com/advisories/',
              directDependency: 'nx',
              fixInformation: 'Fix is available.',
            },
            {
              name: 'verdaccio',
              severity: 'critical',
              versionRange: '*',
              title: 'SSR forgery',
              url: 'https://github.com/advisories/',
              directDependency: true,
              fixInformation: 'Fix is available.',
            },
          ],
          summary: {
            critical: 0,
            high: 2,
            moderate: 1,
            low: 0,
            info: 0,
            total: 3,
          },
        },
        'npm',
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
      summaryToDisplayValue({
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
      summaryToDisplayValue({
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
  const vulnerabilityDefaults: Vulnerability = {
    name: 'verdaccio',
    severity: 'high',
    versionRange: '<=5.28.0',
    fixInformation: false,
    directDependency: true,
  };

  it('should provide a vulnerability summary', () => {
    expect(
      vulnerabilitiesToIssues(
        [
          {
            name: 'verdaccio',
            severity: 'high',
            versionRange: '<=5.28.0',
            fixInformation: false,
            directDependency: true,
          },
        ],
        defaultAuditLevelMapping,
      ),
    ).toEqual<Issue[]>([
      {
        message:
          '`verdaccio` dependency has a **high** vulnerability in versions **<=5.28.0**.',

        severity: 'error',
      },
    ]);
  });

  it('should include vulnerability title and URL when provided', () => {
    expect(
      vulnerabilitiesToIssues(
        [
          {
            ...vulnerabilityDefaults,
            name: 'tough-cookie',
            title: 'tough-cookie Prototype Pollution vulnerability',
            url: 'https://github.com/advisories/GHSA-72xf-g2v4-qvf3',
          },
        ],
        defaultAuditLevelMapping,
      ),
    ).toEqual<Issue[]>([
      expect.objectContaining({
        message: expect.stringContaining(
          'More information: [tough-cookie Prototype Pollution vulnerability](https://github.com/advisories/GHSA-72xf-g2v4-qvf3)',
        ),
      }),
    ]);
  });

  it('should include direct dependency', () => {
    expect(
      vulnerabilitiesToIssues(
        [
          {
            ...vulnerabilityDefaults,
            name: '@cypress/request',
            directDependency: 'cypress',
          },
        ],
        defaultAuditLevelMapping,
      ),
    ).toEqual<Issue[]>([
      expect.objectContaining({
        message: expect.stringContaining(
          "`cypress`'s dependency `@cypress/request` has",
        ),
      }),
    ]);
  });

  it('should omit direct dependency when not provided', () => {
    expect(
      vulnerabilitiesToIssues(
        [
          {
            ...vulnerabilityDefaults,
            name: 'semver',
            directDependency: '',
          },
        ],
        defaultAuditLevelMapping,
      ),
    ).toEqual<Issue[]>([
      expect.objectContaining({
        message: expect.stringContaining('`semver` dependency has'),
      }),
    ]);
  });

  it('should correctly map vulnerability level to issue severity', () => {
    expect(
      vulnerabilitiesToIssues(
        [
          {
            ...vulnerabilityDefaults,
            name: 'verdaccio',
            severity: 'high',
            directDependency: true,
          },
        ],
        { ...defaultAuditLevelMapping, high: 'info' },
      ),
    ).toEqual<Issue[]>([
      {
        message: expect.stringContaining('verdaccio'),
        severity: 'info',
      },
    ]);
  });

  it('should translate any version range to human-friendly summary', () => {
    expect(
      vulnerabilitiesToIssues(
        [
          {
            ...vulnerabilityDefaults,
            name: 'request',
            versionRange: '*',
            directDependency: true,
          },
        ],
        defaultAuditLevelMapping,
      ),
    ).toEqual<Issue[]>([
      expect.objectContaining({
        message: expect.stringContaining('vulnerability in **all** versions'),
      }),
    ]);
  });

  it('should return empty array for no vulnerabilities', () => {
    expect(vulnerabilitiesToIssues([], defaultAuditLevelMapping)).toEqual([]);
  });
});
