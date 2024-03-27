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
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-prod',
      score: 0.5,
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
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-prod',
      score: 0.75,
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
      ),
    ).toEqual<AuditOutput>({
      slug: 'npm-outdated-optional',
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
    expect(outdatedToDisplayValue({ major: 0, minor: 0, patch: 0 })).toBe(
      'all dependencies are up to date',
    );
  });

  it('should explicitly state outdated dependencies', () => {
    expect(outdatedToDisplayValue({ major: 5, minor: 2, patch: 1 })).toBe(
      '8 outdated package versions (5 major, 2 minor, 1 patch)',
    );
  });

  it('should only list version types that have outdated dependencies', () => {
    expect(outdatedToDisplayValue({ major: 2, minor: 0, patch: 3 })).toBe(
      '5 outdated package versions (2 major, 3 patch)',
    );
  });

  it('should skip breakdown if only one version type is outdated', () => {
    expect(outdatedToDisplayValue({ major: 0, minor: 4, patch: 0 })).toBe(
      '4 minor outdated package versions',
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
