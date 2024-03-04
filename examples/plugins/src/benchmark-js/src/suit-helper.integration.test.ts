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
            () => new Promise(resolve => setTimeout(resolve, 5)),
          ],
          [
            'slower-implementation',
            () => new Promise(resolve => setTimeout(resolve, 8)),
          ],
        ],
      }),
    ).resolves.toEqual([
      {
        suitName: 'suite-1',
        name: 'current-implementation',
        isTarget: true,
        hz: expect.any(Number),
        isFastest: true,
        rme: expect.any(Number),
        samples: expect.any(Number),
      } satisfies BenchmarkResult,
    ]);
  });
}, 6000);
