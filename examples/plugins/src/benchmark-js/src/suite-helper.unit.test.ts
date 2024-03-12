import { Bench } from 'tinybench';
import { describe, expect, it } from 'vitest';
import { benchToBenchmarkResult } from './tinybench.suite-runner';

describe('benchToBenchmarkResult', () => {
  it('should transform a tinybench Bench to a enriched BenchmarkResult', () => {
    const currentImplementation = {
      hz: 175.3,
      rme: 0.4,
      samples: [5.6, 5.6],
    };
    const slowerImplementation = {
      hz: 75.3,
      rme: 0.4,
      samples: [5.6, 5.6],
    };
    const bench = {
      getTask: (name: string) => {
        const result =
          // eslint-disable-next-line vitest/no-conditional-tests
          name === 'current-implementation'
            ? currentImplementation
            : slowerImplementation;
        return { result };
      },
      results: [currentImplementation, slowerImplementation],
    };
    expect(
      benchToBenchmarkResult(bench as unknown as Bench, {
        suiteName: 'suite-1',
        cases: [
          ['current-implementation', vi.fn()],
          ['slower-implementation', vi.fn()],
        ],
        targetImplementation: 'current-implementation',
      }),
    ).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          suiteName: 'suite-1',
          name: 'current-implementation',
          isTarget: true,
          hz: 175.3,
          isFastest: true,
          rme: 0.4,
          samples: 2,
        }),
        expect.objectContaining({
          suiteName: 'suite-1',
          name: 'slower-implementation',
          isTarget: false,
          hz: 75.3,
          isFastest: false,
          rme: 0.4,
          samples: 2,
        }),
      ]),
    );
  });
});
