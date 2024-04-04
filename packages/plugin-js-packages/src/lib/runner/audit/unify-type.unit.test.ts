import { describe, expect, it } from 'vitest';
import { toJsonLines } from '@code-pushup/utils';
import {
  AuditResult,
  NpmAdvisory,
  NpmAuditResultJson,
  NpmVulnerability,
  PnpmAuditResultJson,
  Yarnv1AuditAdvisory,
  Yarnv1AuditSummary,
  Yarnv2AuditResultJson,
} from './types';
import {
  npmToAdvisory,
  npmToAuditResult,
  npmToFixInformation,
  pnpmToAuditResult,
  pnpmToDirectDependency,
  yarnv1ToAuditResult,
  yarnv2ToAuditResult,
} from './unify-type';

const EMPTY_AUDIT_RESULT = {
  vulnerabilities: [],
  summary: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
};

describe('npmToAuditResult', () => {
  it('should transform NPM audit to unified audit result', () => {
    expect(
      npmToAuditResult(
        JSON.stringify({
          vulnerabilities: {
            request: {
              name: 'request',
              severity: 'critical',
              range: '2.0.0 - 3.0.0',
              via: [
                { title: 'SSR forgery', url: 'https://github.com/advisories/' },
              ],
              isDirect: true,
              effects: [],
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
        } satisfies NpmAuditResultJson),
      ),
    ).toEqual<AuditResult>({
      vulnerabilities: [
        {
          name: 'request',
          severity: 'critical',
          versionRange: '2.0.0 - 3.0.0',
          title: 'SSR forgery',
          url: 'https://github.com/advisories/',
          directDependency: true,
          fixInformation: '',
        },
      ],
      summary: { critical: 1, high: 0, moderate: 0, low: 0, info: 0, total: 1 },
    });
  });

  it('should mention direct dependency for vulnerability in indirect dependency', () => {
    expect(
      npmToAuditResult(
        JSON.stringify({
          vulnerabilities: {
            request: {
              name: '@cypress/request',
              severity: 'moderate',
              range: '<=2.88.12',
              via: [
                {
                  title: 'SSR forgery',
                  url: 'https://github.com/advisories/',
                },
              ],
              isDirect: false,
              effects: ['cypress'], // direct dependency name
              fixAvailable: true,
            },
          },
          metadata: {
            vulnerabilities: {
              critical: 0,
              high: 0,
              moderate: 1,
              low: 0,
              info: 0,
              total: 1,
            },
          },
        } satisfies NpmAuditResultJson),
      ),
    ).toEqual<AuditResult>({
      vulnerabilities: [
        {
          name: 'request',
          severity: 'moderate',
          versionRange: '<=2.88.12',
          title: 'SSR forgery',
          url: 'https://github.com/advisories/',
          directDependency: 'cypress',
          fixInformation: 'Fix is available.',
        },
      ],
      summary: { critical: 0, high: 0, moderate: 1, low: 0, info: 0, total: 1 },
    });
  });

  it('should transform no vulnerabilities to empty audit result', () => {
    expect(
      npmToAuditResult(
        JSON.stringify({
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
        } satisfies NpmAuditResultJson),
      ),
    ).toStrictEqual(EMPTY_AUDIT_RESULT);
  });
});

describe('npmToFixInformation', () => {
  it('should format fix recommendation', () => {
    expect(
      npmToFixInformation({
        name: '@angular-devkit/build-angular',
        version: '17.3.0',
        isSemVerMajor: false,
      }),
    ).toBe(
      'Fix available: Update `@angular-devkit/build-angular` to version **17.3.0**.',
    );
  });

  it('should mention breaking change for major version update', () => {
    expect(
      npmToFixInformation({
        name: 'cypress',
        version: '13.7.0',
        isSemVerMajor: true,
      }),
    ).toBe(
      'Fix available: Update `cypress` to version **13.7.0** (breaking change).',
    );
  });

  it('should only mention fix is available when no details are provided', () => {
    expect(npmToFixInformation(true)).toBe('Fix is available.');
  });

  it('should skip this section if fix is not available', () => {
    expect(npmToFixInformation(false)).toBe('');
  });
});

describe('npmToAdvisory', () => {
  it('should print direct advisory information', () => {
    expect(
      npmToAdvisory('cypress', {
        cypress: {
          name: 'cypress',
          via: [{ title: 'SSR forgery', url: 'https://github.com/advisories' }],
        } as NpmVulnerability,
      }),
    ).toEqual<NpmAdvisory>({
      title: 'SSR forgery',
      url: 'https://github.com/advisories',
    });
  });

  it('should print cross-referenced advisory information', () => {
    expect(
      npmToAdvisory('@nrwl/nx-cloud', {
        axios: {
          name: 'axios',
          via: [
            {
              title: 'Axios Cross-Site Forgery',
              url: 'https://github.com/advisories',
            },
          ],
        } as NpmVulnerability,
        '@nrwl/nx-cloud': {
          name: '@nrwl/nx-cloud',
          via: ['nx-cloud'],
        } as NpmVulnerability,
        'nx-cloud': {
          name: 'nx-cloud',
          via: ['@nrwl/nx-cloud', 'axios'],
        } as NpmVulnerability,
      }),
    ).toEqual<NpmAdvisory>({
      title: 'Axios Cross-Site Forgery',
      url: 'https://github.com/advisories',
    });
  });

  it('should return empty values if advisory is missing', () => {
    expect(
      npmToAdvisory('tough-cookie', {
        cypress: {
          name: 'tough-cookie',
          via: [] as string[],
        } as NpmVulnerability,
      }),
    ).toBeNull();
  });
});

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
    ).toStrictEqual(EMPTY_AUDIT_RESULT);
  });
});

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
    ).toStrictEqual(EMPTY_AUDIT_RESULT);
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
