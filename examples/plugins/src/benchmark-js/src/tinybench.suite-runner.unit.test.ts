import { Bench } from 'tinybench';
import { describe, expect, it } from 'vitest';
import { benchToBenchmarkResult } from './tinybench.suite-runner';

describe('benchToBenchmarkResult', () => {
  it('should transform a tinybench Bench to a enriched BenchmarkResult', () => {
    const resultMap = {
      'current-implementation': {
        hz: 175.333_33,
        rme: 0.444_44,
        samples: [5.6, 5.6],
      },
      'slower-implementation': {
        hz: 75.333_33,
        rme: 0.444_44,
        samples: [5.6666, 5.6666],
      },
    };
    const suitNames = Object.keys(resultMap);

    expect(
      benchToBenchmarkResult(
        {
          getTask: (name: keyof typeof resultMap) => ({
            result: resultMap[name],
          }),
          results: Object.values(resultMap),
        } as Bench,
        {
          suiteName: 'suite-1',
          cases: suitNames.map(name => [name, vi.fn()]),
          targetImplementation: suitNames.at(0) as string,
        },
      ),
    ).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          suiteName: 'suite-1',
          name: 'current-implementation',
          isTarget: true,
          hz: 175.333_33,
          isFastest: true,
          rme: 0.444_44,
          samples: 2,
        }),
        expect.objectContaining({
          suiteName: 'suite-1',
          name: 'slower-implementation',
          isTarget: false,
          hz: 75.333_33,
          isFastest: false,
          rme: 0.444_44,
          samples: 2,
        }),
      ]),
    );
  });
});
