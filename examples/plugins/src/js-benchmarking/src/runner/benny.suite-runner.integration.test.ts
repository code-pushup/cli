import { describe, expect, it } from 'vitest';
import dummySuite from '../../../../perf/dummy-suite';
import { bennyRunner } from './benny.suite-runner';

describe('bennyRunner-execution', () => {
  // @TODO move to e2e tests when plugin is released officially

  it('should execute valid suite', async () => {
    await expect(bennyRunner.run(dummySuite)).resolves.toStrictEqual(
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
