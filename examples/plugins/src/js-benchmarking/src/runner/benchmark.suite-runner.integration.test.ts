import { describe, expect, it } from 'vitest';
import dummySuite from '../../../../perf/dummy-suite';
import { benchmarkRunner } from './benchmark.suite-runner';

describe('benchmarkRunner-execution', () => {
  // @TODO move to e2e tests when plugin is released officially
  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should execute valid suite', async () => {
    await expect(benchmarkRunner.run(dummySuite)).resolves.toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          suiteName: 'dummy-suite',
          name: 'case-1',
          isTarget: true,
          hz: expect.any(Number),
          isFastest: true,
          rme: expect.any(Number),
          samples: expect.any(Number),
        }),
        expect.objectContaining({
          suiteName: 'dummy-suite',
          name: 'case-2',
          isTarget: false,
          hz: expect.any(Number),
          isFastest: false,
          rme: expect.any(Number),
          samples: expect.any(Number),
        }),
      ]),
    );
  });
});
