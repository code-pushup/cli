import { describe, expect, it } from 'vitest';
import { factorial } from '../../../../perf/dummy-suite/factorial';
import { bencnmarkRunner } from './benchmark.suite-runner';

describe('benchmark runner', () => {
  it('should execute valid suite', async () => {
    await expect(
      bencnmarkRunner.run({
        suiteName: 'suite-1',
        targetImplementation: 'current-implementation',
        cases: [
          ['current-implementation', () => 1],
          ['slower-implementation', () => factorial(1000)],
        ],
      }),
    ).resolves.toStrictEqual(expect.arrayContaining([]));
  }, 15_000);
});
