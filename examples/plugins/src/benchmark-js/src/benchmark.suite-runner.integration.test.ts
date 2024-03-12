import { describe, expect, it } from 'vitest';
import { runner } from './benchmark.suite-runner';

describe('benchmark runner', () => {
  it('should execute valid suite', async () => {
    await expect(
      runner.run({
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
  }, 20_000);
});
