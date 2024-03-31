import { describe, expect, it } from 'vitest';
import { tinybenchRunner } from './tinybench.suite-runner';
import type { BenchmarkResult } from './types';

describe('tinybench runner', () => {
  it('should execute valid suite', async () => {
    await expect(
      tinybenchRunner.run({
        suiteName: 'suite-1',
        targetImplementation: 'current-implementation',
        cases: [
          [
            'current-implementation',
            () => new Promise(resolve => setTimeout(resolve, 5)),
          ],
          [
            'slower-implementation',
            () => new Promise(resolve => setTimeout(resolve, 500)),
          ],
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
  }, 15_000);
});
