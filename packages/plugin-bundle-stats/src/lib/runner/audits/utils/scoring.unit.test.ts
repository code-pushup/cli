import { describe, expect, it } from 'vitest';
import type { Issue } from '@code-pushup/models';
import type { MinMax } from '../types.js';
import { calculatePenalty, createBundleStatsScoring } from './scoring.js';

describe('calculatePenalty', () => {
  it('should handle empty issues array', () => {
    expect(
      calculatePenalty([], { errorWeight: 1, warningWeight: 0.5 }),
    ).toStrictEqual(0);
  });

  it('should calculate penalty from error issues', () => {
    expect(
      calculatePenalty([
        { severity: 'error' },
        { severity: 'error' },
      ] as Issue[]),
    ).toStrictEqual(2 / 1.5); // (1*2) / (1+0.5) = 2/1.5
  });

  it('should calculate penalty from warning issues', () => {
    expect(
      calculatePenalty([
        { severity: 'warning' },
        { severity: 'warning' },
      ] as Issue[]),
    ).toStrictEqual(1 / 1.5); // (0.5*2) / (1+0.5) = 1/1.5
  });

  it('should calculate penalty from mixed issues', () => {
    expect(
      calculatePenalty([
        { severity: 'error' },
        { severity: 'warning' },
        { severity: 'warning' },
      ] as Issue[]),
    ).toStrictEqual(4 / 3); // (2*1 + 1*2) / (2+1) = 4/3
  });

  it('should use custom penalty weights', () => {
    expect(
      calculatePenalty(
        [{ severity: 'error' }, { severity: 'warning' }] as Issue[],
        {
          errorWeight: 3,
          warningWeight: 2,
        },
      ),
    ).toStrictEqual(5 / 5); // (3*1 + 2*1) / (3+2) = 1
  });
});

describe('createBundleStatsScoring', () => {
  it('should create a score calculator function', () => {
    expect(
      typeof createBundleStatsScoring({
        totalSize: [25_000, 1_000_000] as MinMax,
        penalty: { errorWeight: 1, warningWeight: 0.5 },
      }),
    ).toStrictEqual('function');
  });

  it.each([
    ['small bundle', 150_000, [50_000, 1_000_000] as MinMax, 1.0],
    ['medium bundle', 500_000, [100_000, 1_000_000] as MinMax, 1.0],
    ['large bundle', 1_200_000, [200_000, 1_000_000] as MinMax, 0],
  ])(
    'should calculate size score correctly for %s',
    (description, bundleSize, threshold, expectedScore) => {
      expect(
        createBundleStatsScoring({
          totalSize: threshold,
          penalty: false,
        })(bundleSize, []),
      ).toStrictEqual(expectedScore);
    },
  );

  it('should give score 0 for bundles exceeding single threshold', () => {
    const calculator = createBundleStatsScoring({
      totalSize: [0, 1_000_000],
      penalty: false,
    });

    expect(calculator(1_500_000, [])).toStrictEqual(0);
    expect(calculator(1_000_000, [])).toStrictEqual(1.0);
    expect(calculator(500_000, [])).toStrictEqual(1.0);
  });

  it('should give score 0 for bundles exceeding range threshold maximum', () => {
    const calculator = createBundleStatsScoring({
      totalSize: [300_000, 1_000_000] as MinMax,
      penalty: false,
    });

    expect(calculator(1_500_000, [])).toStrictEqual(0);
    expect(calculator(1_000_000, [])).toStrictEqual(1.0);
    expect(calculator(500_000, [])).toStrictEqual(1.0);
  });

  it('should return early when penalty is false', () => {
    expect(
      createBundleStatsScoring({
        totalSize: [80_000, 1_000_000] as MinMax,
        penalty: false,
      })(800_000, [{ severity: 'error' }, { severity: 'warning' }] as Issue[]),
    ).toStrictEqual(1.0);
  });

  it('should combine size score with default penalty', () => {
    expect(
      createBundleStatsScoring({
        totalSize: [40_000, 1_000_000] as MinMax,
      })(800_000, [{ severity: 'error' }] as Issue[]),
    ).toStrictEqual(0.8); // 1.0 - (1 * 0.2) = 0.8
  });

  it('should combine size score with custom penalty', () => {
    expect(
      createBundleStatsScoring({
        totalSize: [40_000, 1_000_000] as MinMax,
        penalty: {
          errorWeight: 0.25,
          warningWeight: 0.1,
        },
      })(800_000, [{ severity: 'error' }] as Issue[]),
    ).toStrictEqual(0.75); // 1.0 - (1 * 0.25) = 0.75
  });

  it('should handle scoring with a single threshold', () => {
    const calculator = createBundleStatsScoring({
      totalSize: [50_000, 100_000] as MinMax,
      penalty: false,
    });

    expect(calculator(25_000, [])).toStrictEqual(0.5); // 25_000 / 50_000 = 0.5
    expect(calculator(75_000, [])).toStrictEqual(1.0);
    expect(calculator(150_000, [])).toStrictEqual(0);
  });

  it('should handle size within range with penalties', () => {
    const calculator = createBundleStatsScoring({
      totalSize: [25_000, 1_000_000] as MinMax,
      penalty: {
        errorWeight: 0.2,
        warningWeight: 0.1,
      },
    });

    expect(calculator(150_000, [])).toStrictEqual(1.0);
    expect(
      calculator(150_000, [{ severity: 'error' }] as Issue[]),
    ).toStrictEqual(0.8); // 1.0 - 0.2 = 0.8
    expect(
      calculator(150_000, [{ severity: 'warning' }] as Issue[]),
    ).toStrictEqual(0.9); // 1.0 - 0.1 = 0.9
  });
});
