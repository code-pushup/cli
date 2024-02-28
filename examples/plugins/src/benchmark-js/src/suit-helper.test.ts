import { describe, expect, it } from 'vitest';
import { BenchmarkResult, runSuit } from './suit-helper';

describe('runSuit', () => {
  it('should execute valid suite', async () => {
    await expect(
      runSuit({
        suitName: 'suite-1',
        targetImplementation: 'current-implementation',
        cases: [
          [
            'current-implementation',
            () => new Promise(resolve => setTimeout(resolve, 50)),
          ],
        ],
      }),
    ).resolves.toEqual([
      {
        suitName: 'suite-1',
        name: 'current-implementation',
        isTarget: true,
        hz: 100,
        isFastest: true,
        rme: 100,
        samples: 4,
      } satisfies BenchmarkResult,
    ]);
  });
});
