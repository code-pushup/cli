import { describe, expect, it } from 'vitest';
import { factorial } from '../../../../perf/dummy-suite/factorial';
import { benchmarkRunner } from './benchmark.suite-runner';

describe('benchmark runner', () => {
  // @TODO move to e2e tests when plugin is released officially
  it.skip('should execute valid suite', async () => {
    await expect(
      benchmarkRunner.run({
        suiteName: 'suite-1',
        targetImplementation: 'current-implementation',
        cases: [
          ['current-implementation', () => 1],
          ['slower-implementation', () => factorial(1000)],
        ],
      }),
    ).resolves.toStrictEqual(expect.arrayContaining([]));
  }, 13_500);
});
