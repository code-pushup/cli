import { describe, expect, it } from 'vitest';
import { AuditResult, Vulnerability } from './audit/types';
import { filterAuditResult } from './utils';

describe('filterAuditResult', () => {
  describe('filtering out NPM production vulnerabilities', () => {
    const prodResult: AuditResult = {
      vulnerabilities: [
        {
          name: 'moment',
          severity: 'moderate',
          versionRange: '*',
          fixInformation: '',
          directDependency: true,
        },
        {
          name: 'request',
          severity: 'high',
          versionRange: '*',
          fixInformation: false,
          directDependency: true,
        },
      ],
      summary: {
        critical: 0,
        high: 1,
        moderate: 1,
        low: 0,
        info: 0,
        total: 2,
      },
    };

    it('should leave non-prod vulnerabilities', () => {
      expect(
        filterAuditResult(prodResult, 'name', prodResult),
      ).toEqual<AuditResult>({
        vulnerabilities: [],
        summary: {
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0,
          info: 0,
          total: 0,
        },
      });
    });

    it('should filter out all vulnerabilities if present in prod', () => {
      expect(
        filterAuditResult(
          {
            vulnerabilities: [
              ...prodResult.vulnerabilities,
              {
                name: '@cypress/request',
                severity: 'critical',
                versionRange: '<12.7.0',
                fixInformation: false,
                directDependency: 'cypress',
              },
            ],
            summary: {
              ...prodResult.summary,
              critical: 1,
            },
          },
          'name',
          prodResult,
        ),
      ).toEqual<AuditResult>({
        vulnerabilities: [
          {
            name: '@cypress/request',
            severity: 'critical',
            versionRange: '<12.7.0',
            fixInformation: false,
            directDependency: 'cypress',
          },
        ],
        summary: {
          critical: 1,
          high: 0,
          moderate: 0,
          low: 0,
          info: 0,
          total: 0,
        },
      });
    });
  });

  describe('filtering Yarn v1 duplicates based on ID', () => {
    it('should filter out duplicate IDs and update summary', () => {
      expect(
        filterAuditResult(
          {
            vulnerabilities: [
              { id: 1, severity: 'high' },
              { id: 2, severity: 'moderate' },
              { id: 1, severity: 'high' },
            ] as Vulnerability[],
            summary: {
              critical: 0,
              high: 2,
              moderate: 1,
              low: 0,
              info: 0,
              total: 3,
            },
          },
          'id',
        ),
      ).toEqual({
        vulnerabilities: [
          { id: 1, severity: 'high' },
          { id: 2, severity: 'moderate' },
        ],
        summary: {
          critical: 0,
          high: 1,
          moderate: 1,
          low: 0,
          info: 0,
          total: 2,
        },
      });
    });

    it('should return empty result for no vulnerabilities', () => {
      const noVulnerabilities = {
        vulnerabilities: [],
        summary: {
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0,
          info: 0,
          total: 0,
        },
      };
      expect(filterAuditResult(noVulnerabilities, 'id')).toEqual(
        noVulnerabilities,
      );
    });
  });
});
