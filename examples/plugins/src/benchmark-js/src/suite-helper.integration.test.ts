import { describe, expect, it } from 'vitest';
import { BenchmarkResult, runSuite } from './suite-helper';

describe('runSuite', () => {
  it('should execute valid suite', async () => {
    await expect(
      runSuite({
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
  });
}, 20_000);
