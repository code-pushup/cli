import { describe, expect, it } from 'vitest';
import dummySuite from '../../../../perf/dummy-suite';
import { tinybenchRunner } from './tinybench.suite-runner';

describe('tinybenchRunner-execution', () => {
  it('should execute valid suite', async () => {
    await expect(tinybenchRunner.run(dummySuite)).resolves.toEqual(
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
