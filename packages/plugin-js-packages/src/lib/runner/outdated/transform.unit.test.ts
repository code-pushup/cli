import type { AuditOutput, Issue } from '@code-pushup/models';
import { objectFromEntries } from '@code-pushup/utils';
import { RELEASE_TYPES } from './constants.js';
import {
  calculateOutdatedScore,
  outdatedResultToAuditOutput,
  outdatedToDisplayValue,
  outdatedToIssues,
} from './transform.js';

describe('outdatedResultToAuditOutput', () => {
  it('should create an audit output', () => {
    expect(
      outdatedResultToAuditOutput(
        [
          {
            name: 'moment',
            current: '4.5.0',
            latest: '4.5.2',
            type: 'dependencies',
          },
        ],
        'npm',
        'prod',
        10,
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-prod',
      score: 1,
      value: 1,
      displayValue: '1 patch outdated package version',
      details: {
        issues: [
          {
            message: expect.stringContaining(
              'Package `moment` requires a **patch** update',
            ),
            severity: 'info',
          },
        ],
      },
    });
  });

  it('should distinguish up-to-date from outdated dependencies', () => {
    expect(
      outdatedResultToAuditOutput(
        [
          {
            name: 'nx',
            current: '17.0.0',
            latest: '17.0.0',
            type: 'dependencies',
          },
          {
            name: 'prettier',
            current: '2.8.8',
            latest: '3.2.0',
            type: 'dependencies',
          },
        ],
        'npm',
        'prod',
        5,
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-prod',
      score: 0.8,
      value: 1,
      displayValue: '1 major outdated package version',
      details: {
        issues: [
          expect.objectContaining({
            message: expect.stringContaining(
              '`prettier` requires a **major** update',
            ),
          }),
        ],
      },
    });
  });

  it('should combine multiple outdated dependencies', () => {
    expect(
      outdatedResultToAuditOutput(
        [
          {
            name: 'nx',
            current: '15.8.1',
            latest: '17.0.0',
            type: 'dependencies',
          },
          {
            name: 'typescript',
            current: '5.3.0',
            latest: '5.3.3',
            type: 'dependencies',
          },
          {
            name: 'jsdom',
            current: '22.1.0',
            latest: '22.1.2',
            type: 'dependencies',
          },
          {
            name: 'prettier',
            current: '3.0.0',
            latest: '3.2.0',
            type: 'dependencies',
          },
        ],
        'npm',
        'prod',
        10,
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-prod',
      score: 0.9,
      value: 4,
      displayValue: '4 outdated package versions (1 major, 1 minor, 2 patch)',
      details: {
        issues: [
          {
            message: expect.stringContaining(
              '`nx` requires a **major** update',
            ),
            severity: 'error',
          },
          {
            message: expect.stringContaining(
              '`typescript` requires a **patch** update',
            ),
            severity: 'info',
          },
          {
            message: expect.stringContaining(
              '`jsdom` requires a **patch** update',
            ),
            severity: 'info',
          },
          {
            message: expect.stringContaining(
              '`prettier` requires a **minor** update',
            ),
            severity: 'warning',
          },
        ],
      },
    });
  });

  it('should omit irrelevant dependency types', () => {
    expect(
      outdatedResultToAuditOutput(
        [
          {
            name: 'memfs',
            current: '5.2.1',
            latest: '5.3.0',
            type: 'devDependencies',
          },
        ],
        'npm',
        'optional',
        1,
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-optional',
      score: 1,
      value: 0,
      displayValue: 'all dependencies are up to date',
      details: { issues: [] },
    });
  });

  it('should skip non-standard versions', () => {
    expect(
      outdatedResultToAuditOutput(
        [
          {
            name: 'memfs',
            current: '4.0.0-alpha.2',
            latest: 'exotic',
            type: 'devDependencies',
          },
        ],
        'npm',
        'optional',
        1,
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-optional',
      score: 1,
      value: 0,
      displayValue: 'all dependencies are up to date',
      details: { issues: [] },
    });
  });

  it('should identify and categorise pre-release tags', () => {
    expect(
      outdatedResultToAuditOutput(
        [
          {
            name: 'esbuild',
            current: '0.5.3',
            latest: '0.6.0-alpha.1',
            type: 'devDependencies',
          },
          {
            name: 'nx-knip',
            current: '0.0.5-5',
            latest: '0.0.5-15',
            type: 'devDependencies',
          },
          {
            name: 'semver',
            current: '7.6.0',
            latest: '7.6.8-2',
            type: 'devDependencies',
          },
          {
            name: 'code-pushup',
            current: '0.30.0',
            latest: '1.0.0-alpha.1',
            type: 'devDependencies',
          },
        ],
        'npm',
        'dev',
        1,
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-dev',
      score: 1,
      value: 4,
      displayValue:
        '4 outdated package versions (1 premajor, 1 preminor, 1 prepatch, 1 prerelease)',
      details: {
        issues: [
          {
            message: expect.stringContaining(
              '`esbuild` requires a **preminor** update',
            ),
            severity: 'info',
          },
          {
            message: expect.stringContaining(
              '`nx-knip` requires a **prerelease** update',
            ),
            severity: 'info',
          },
          {
            message: expect.stringContaining(
              '`semver` requires a **prepatch** update',
            ),
            severity: 'info',
          },
          {
            message: expect.stringContaining(
              '`code-pushup` requires a **premajor** update',
            ),
            severity: 'info',
          },
        ],
      },
    });
  });
});

describe('calculateOutdatedScore', () => {
  it('should calculate perfect score for no dependencies with outdated major version', () => {
    expect(calculateOutdatedScore(0, 5)).toBe(1);
  });

  it('should calculate proportionate score for major outdated dependencies', () => {
    expect(calculateOutdatedScore(1, 5)).toBe(0.8);
  });
});

describe('outdatedToDisplayValue', () => {
  const ZERO_STATS = objectFromEntries(
    RELEASE_TYPES.map(versionType => [versionType, 0]),
  );

  it('should display perfect value e for no outdated dependencies', () => {
    expect(outdatedToDisplayValue(ZERO_STATS)).toBe(
      'all dependencies are up to date',
    );
  });

  it('should explicitly state outdated dependencies', () => {
    expect(
      outdatedToDisplayValue({
        major: 5,
        premajor: 1,
        minor: 2,
        preminor: 2,
        patch: 1,
        prepatch: 1,
        prerelease: 3,
      }),
    ).toBe(
      '15 outdated package versions (5 major, 1 premajor, 2 minor, 2 preminor, 1 patch, 1 prepatch, 3 prerelease)',
    );
  });

  it('should only list version types that have outdated dependencies', () => {
    expect(outdatedToDisplayValue({ ...ZERO_STATS, major: 2, patch: 3 })).toBe(
      '5 outdated package versions (2 major, 3 patch)',
    );
  });

  it('should skip breakdown if only one version type is outdated', () => {
    expect(outdatedToDisplayValue({ ...ZERO_STATS, prerelease: 4 })).toBe(
      '4 prerelease outdated package versions',
    );
  });
});

describe('outdatedToIssues', () => {
  it('should create an issue for an outdated dependency', () => {
    expect(
      outdatedToIssues([
        {
          name: 'moment',
          current: '2.29.0',
          latest: '2.30.0',
          type: 'dependencies',
        },
      ]),
    ).toEqual<Issue[]>([
      {
        message:
          'Package `moment` requires a **minor** update from **2.29.0** to **2.30.0**.',
        severity: 'warning',
      },
    ]);
  });

  it('should include package URL when provided', () => {
    expect(
      outdatedToIssues([
        {
          name: 'nx',
          current: '16.8.2',
          latest: '17.0.0',
          type: 'dependencies',
          url: 'https://nx.dev',
        },
      ]),
    ).toEqual<Issue[]>([
      expect.objectContaining({
        message: expect.stringContaining('[`nx`](https://nx.dev) requires'),
      }),
    ]);
  });

  it('should include outdated patch version as info', () => {
    expect(
      outdatedToIssues([
        {
          name: 'memfs',
          current: '4.5.0',
          latest: '4.5.1',
          type: 'devDependencies',
        },
      ]),
    ).toEqual<Issue[]>([
      expect.objectContaining({
        severity: 'info',
      }),
    ]);
  });

  it('should return empty issues for no outdated dependencies', () => {
    expect(outdatedToIssues([])).toEqual([]);
  });
});
