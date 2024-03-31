import { describe, expect, it } from 'vitest';
import { bencnmarkRunner } from './benchmark.suite-runner';

describe('benchmark runner', () => {
  it('should execute valid suite', async () => {
    await expect(
      bencnmarkRunner.run({
        suiteName: 'suite-1',
        targetImplementation: 'current-implementation',
        cases: [
          [
            'current-implementation',
            () => new Promise(resolve => setTimeout(resolve, 5)),
          ],
          [
            'slower-implementation',
            () => new Promise(resolve => setTimeout(resolve, 30)),
          ],
        ],
      }),
    ).resolves.toStrictEqual(expect.arrayContaining([]));
  }, 15_000);
});
