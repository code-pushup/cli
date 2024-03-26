import { describe, expect, it } from 'vitest';
import type { AuditOutput, Issue } from '@code-pushup/models';
import {
  calculateOutdatedScore,
  getOutdatedLevel,
  outdatedResultToAuditOutput,
  outdatedToDisplayValue,
  outdatedToIssues,
  splitPackageVersion,
} from './transform';
import { PackageVersion } from './types';

describe('outdatedResultToAuditOutput', () => {
  it('should create an audit output', () => {
    expect(
      outdatedResultToAuditOutput(
        {
          moment: { current: '4.5.0', wanted: '4.5.2', type: 'dependencies' },
        },
        'prod',
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-prod',
      score: 1,
      value: 1,
      displayValue: '1 outdated dependency',
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
        {
          nx: { current: '17.0.0', wanted: '17.0.0', type: 'dependencies' },
          prettier: { current: '2.8.8', wanted: '3.2.0', type: 'dependencies' },
        },
        'prod',
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-prod',
      score: 0.5,
      value: 1,
      displayValue: '1 out of 1 outdated dependencies require major update',
      details: {
        issues: [
          expect.objectContaining({
            message: expect.stringContaining(
              'Package `prettier` requires a **major** update',
            ),
          }),
        ],
      },
    });
  });

  it('should combine multiple outdated dependencies', () => {
    expect(
      outdatedResultToAuditOutput(
        {
          nx: { current: '15.8.1', wanted: '17.0.0', type: 'dependencies' },
          typescript: {
            current: '5.3.0',
            wanted: '5.3.3',
            type: 'dependencies',
          },
          jsdom: { current: '22.1.0', wanted: '22.1.2', type: 'dependencies' },
          prettier: {
            current: '3.0.0',
            wanted: '3.2.0',
            type: 'dependencies',
          },
        },
        'prod',
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-prod',
      score: 0.75,
      value: 4,
      displayValue: '1 out of 4 outdated dependencies require major update',
      details: {
        issues: [
          {
            message: expect.stringContaining(
              'Package `nx` requires a **major** update',
            ),
            severity: 'error',
          },
          {
            message: expect.stringContaining(
              'Package `typescript` requires a **patch** update',
            ),
            severity: 'info',
          },
          {
            message: expect.stringContaining(
              'Package `jsdom` requires a **patch** update',
            ),
            severity: 'info',
          },
          {
            message: expect.stringContaining(
              'Package `prettier` requires a **minor** update',
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
        {
          memfs: {
            current: '5.2.1',
            wanted: '5.3.0',
            type: 'devDependencies',
          },
        },
        'optional',
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-optional',
      score: 1,
      value: 0,
      displayValue: 'all dependencies are up to date',
    });
  });

  it('should filter out invalid dependencies (missing current)', () => {
    expect(
      outdatedResultToAuditOutput(
        {
          nx: { wanted: '17.0.0', type: 'dependencies' },
        },
        'prod',
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-prod',
      score: 1,
      value: 0,
      displayValue: 'all dependencies are up to date',
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
  it('should display perfect value e for no outdated dependencies', () => {
    expect(outdatedToDisplayValue(0, 0)).toBe(
      'all dependencies are up to date',
    );
  });

  it('should explicitly state outdated major dependencies', () => {
    expect(outdatedToDisplayValue(2, 3)).toBe(
      '2 out of 3 outdated dependencies require major update',
    );
  });

  it('should summarise outdated dependencies if only minor or patch versions are outdated', () => {
    expect(outdatedToDisplayValue(0, 3)).toBe('3 outdated dependencies');
  });
});

describe('outdatedToIssues', () => {
  it('should create an issue for an outdated dependency', () => {
    expect(
      outdatedToIssues([
        [
          'moment',
          { current: '2.29.0', wanted: '2.30.0', type: 'dependencies' },
        ],
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
        [
          'nx',
          {
            current: '16.8.2',
            wanted: '17.0.0',
            type: 'dependencies',
            homepage: 'https://nx.dev',
          },
        ],
      ]),
    ).toEqual<Issue[]>([
      expect.objectContaining({
        message: expect.stringContaining(
          'Package [`nx`](https://nx.dev) requires',
        ),
      }),
    ]);
  });

  it('should include outdated patch version as info', () => {
    expect(
      outdatedToIssues([
        [
          'memfs',
          {
            current: '4.5.0',
            wanted: '4.5.1',
            type: 'devDependencies',
          },
        ],
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

describe('getOutdatedLevel', () => {
  it('should return outdated major version', () => {
    expect(getOutdatedLevel('4.2.1', '5.2.0')).toBe('major');
  });

  it('should prioritise higher outdated version level', () => {
    expect(getOutdatedLevel('6.2.1', '6.3.2')).toBe('minor');
  });
});

describe('splitPackageVersion', () => {
  it('should split version into major, minor and patch', () => {
    expect(splitPackageVersion('0.32.4')).toEqual<PackageVersion>({
      major: 0,
      minor: 32,
      patch: 4,
    });
  });

  it('should throw for an incomplete version', () => {
    expect(() => splitPackageVersion('5.0')).toThrow(
      'Invalid version description 5.0',
    );
  });
});
