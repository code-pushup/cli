import { describe, expect, it } from 'vitest';
import type { Issue } from '@code-pushup/models';
import type { BundleStatsConfig, PenaltyOptions } from '../types.js';
import { calculateScore } from './scoring.js';

describe('calculateScore', () => {
  const bundleConfig: BundleStatsConfig = {
    title: 'Main Bundle',
    slug: 'main-bundle',
    description: 'Main application bundle',
    thresholds: {
      totalSize: [0, 1000000], // [min, max] tuple
    },
  };

  it.each([
    [0, 1.0], // Empty bundle
    [500000, 1.0], // Within limit
    [1000000, 1.0], // At exact limit
    [1100000, 0.9], // 10% over limit
    [1500000, 0.5], // 50% over limit
    [2000000, 0], // 100% over limit
    [3000000, 0], // 200% over limit (capped at 0)
  ])(
    'calculates size score correctly for %i bytes → %f',
    (bundleSize, expectedScore) => {
      expect(calculateScore(bundleSize, bundleConfig)).toBe(expectedScore);
    },
  );

  it('applies error penalty with default weight', () => {
    const errorIssues: Issue[] = [
      { message: 'main.js is 2.1MB (exceeds 1MB)', severity: 'error' },
    ];

    const score = calculateScore(800000, bundleConfig, errorIssues);

    expect(score).toBe(0.5); // 1.0 - (1*1)/(1+0.5+0.5) = 0.5
  });

  it('applies warning penalty with default weight', () => {
    const warningIssues: Issue[] = [
      { message: 'utils.js is 50B (below 1KB)', severity: 'warning' },
    ];

    const score = calculateScore(800000, bundleConfig, warningIssues);

    expect(score).toBe(0.75); // 1.0 - (0.5*1)/(1+0.5+0.5) = 0.75
  });

  it('applies blacklist penalty with default weight', () => {
    const blacklistIssues: Issue[] = [
      { message: 'lodash matches forbidden pattern', severity: 'warning' },
    ];

    const score = calculateScore(800000, bundleConfig, blacklistIssues);

    expect(score).toBe(0.75); // 1.0 - (0.5*1)/(1+0.5+0.5) = 0.75
  });

  it.each([
    [
      'combines different issue types',
      [
        { message: 'main.js exceeds size limit', severity: 'error' },
        { message: 'utils.js below minimum size', severity: 'warning' },
        { message: 'old-lib is forbidden', severity: 'warning' },
      ] as Issue[],
      0, // 1.0 - (1+0.5+0.5)/(1+0.5+0.5) = 0
    ],
    [
      'counts multiple issues of same type',
      [
        { message: 'main.js exceeds limit', severity: 'error' },
        { message: 'vendor.js exceeds limit', severity: 'error' },
      ] as Issue[],
      0, // 1.0 - (1*2)/(1+0.5+0.5) = 0
    ],
  ])('%s', (description, issues, expectedScore) => {
    const score = calculateScore(800000, bundleConfig, issues);
    expect(score).toBe(expectedScore);
  });

  it('uses custom penalty weights', () => {
    const customWeights: PenaltyOptions = {
      errorWeight: 2,
      warningWeight: 1,
      blacklistWeight: 0.5,
    };
    const errorIssues: Issue[] = [
      { message: 'Bundle too large', severity: 'error' },
    ];

    const score = calculateScore(
      800000,
      bundleConfig,
      errorIssues,
      customWeights,
    );

    expect(score).toBeCloseTo(3 / 7); // 1.0 - (2*1)/(2+1+0.5) = 1.0 - 4/7 = 3/7
  });

  it('defaults blacklist weight to warning weight when not specified', () => {
    const partialOptions: PenaltyOptions = {
      errorWeight: 1,
      warningWeight: 0.8,
    };
    const blacklistIssues: Issue[] = [
      { message: 'Forbidden lib detected', severity: 'warning' },
    ];

    const score = calculateScore(
      800000,
      bundleConfig,
      blacklistIssues,
      partialOptions,
    );

    expect(score).toBeCloseTo(9 / 13); // 1.0 - (0.8*1)/(1+0.8+0.8) = 9/13
  });

  it('applies both size penalty and issue penalty', () => {
    const errorIssues: Issue[] = [
      { message: 'Bundle exceeds limit', severity: 'error' },
    ];
    const oversizedBundle = 1500000; // 50% over limit

    const score = calculateScore(oversizedBundle, bundleConfig, errorIssues);

    expect(score).toBe(0); // sizeScore(0.5) - penalty(0.5) = 0
  });

  it('ensures score never goes below zero', () => {
    const severeIssues: Issue[] = [
      { message: 'main.js too large', severity: 'error' },
      { message: 'vendor.js too large', severity: 'error' },
      { message: 'utils.js too small', severity: 'warning' },
      { message: 'bad-lib forbidden', severity: 'warning' },
    ];
    const massiveBundle = 3000000; // Way over limit

    const score = calculateScore(massiveBundle, bundleConfig, severeIssues);

    expect(score).toBe(0);
  });

  it('handles zero penalty weights gracefully', () => {
    const zeroWeights: PenaltyOptions = {
      errorWeight: 0,
      warningWeight: 0,
      blacklistWeight: 0,
    };
    const errorIssues: Issue[] = [
      { message: 'Bundle too large', severity: 'error' },
    ];

    const score = calculateScore(
      800000,
      bundleConfig,
      errorIssues,
      zeroWeights,
    );

    expect(score).toBe(1.0); // No penalty applied when total weight is 0
  });

  it('uses default weights when penalty options are empty', () => {
    const errorIssues: Issue[] = [
      { message: 'Bundle too large', severity: 'error' },
    ];

    const score = calculateScore(800000, bundleConfig, errorIssues, {});

    expect(score).toBe(0.5); // Default weights: error=1, warning=0.5, blacklist=0.5
  });
});
