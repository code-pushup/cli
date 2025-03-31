import { vol } from 'memfs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import type { AuditResult, Vulnerability } from './audit/types.js';
import type { DependencyTotals, PackageJson } from './outdated/types.js';
import { filterAuditResult, getTotalDependencies } from './utils.js';

describe('getTotalDependencies', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({
          dependencies: { '@code-pushup/eslint-config': '1.0.0' },
          devDependencies: {
            cypress: '13.10.0',
            vite: '5.1.4',
            vitest: '1.3.1',
          },
        } satisfies PackageJson),
        [path.join('ui', 'package.json')]: JSON.stringify({
          dependencies: {
            '@code-pushup/eslint-config': '1.0.0',
            '@typescript-eslint/eslint-plugin': '2.0.0',
          },
          devDependencies: {
            angular: '17.0.0',
          },
          optionalDependencies: {
            '@esbuild/darwin-arm64': '^0.19.0',
          },
        } satisfies PackageJson),
      },
      MEMFS_VOLUME,
    );
  });

  it('should return correct number of dependencies', async () => {
    await expect(
      getTotalDependencies(path.join(MEMFS_VOLUME, 'package.json')),
    ).resolves.toStrictEqual({
      dependencies: 1,
      devDependencies: 3,
      optionalDependencies: 0,
    } satisfies DependencyTotals);
  });

  it('should return dependencies for nested package.json file', async () => {
    await expect(
      getTotalDependencies(path.join(MEMFS_VOLUME, 'ui', 'package.json')),
    ).resolves.toStrictEqual({
      dependencies: 2,
      devDependencies: 1,
      optionalDependencies: 1,
    } satisfies DependencyTotals);
  });
});

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
