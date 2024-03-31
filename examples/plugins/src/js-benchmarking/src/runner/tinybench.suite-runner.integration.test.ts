import { describe, expect, it } from 'vitest';
import { factorial } from '../../../../perf/dummy-suite/factorial';
import { tinybenchRunner } from './tinybench.suite-runner';
import type { BenchmarkResult } from './types';

describe('tinybench runner', () => {
  // @TODO move to e2e tests when plugin is released officially
  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should execute valid suite', async () => {
    await expect(
      tinybenchRunner.run({
        suiteName: 'suite-1',
        targetImplementation: 'current-implementation',
        cases: [
          ['current-implementation', () => 1],
          ['slower-implementation', () => factorial(1000)],
        ],
      }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          suiteName: 'suite-1',
          name: 'current-implementation',
          isTarget: true,
          hz: expect.any(Number),
          isFastest: true,
          rme: expect.any(Number),
          samples: expect.any(Number),
        } satisfies BenchmarkResult),
        expect.objectContaining({
          suiteName: 'suite-1',
          name: 'slower-implementation',
          isTarget: false,
          hz: expect.any(Number),
          isFastest: false,
          rme: expect.any(Number),
          samples: expect.any(Number),
        } satisfies BenchmarkResult),
      ]),
    );
  }, 13_500);
});
