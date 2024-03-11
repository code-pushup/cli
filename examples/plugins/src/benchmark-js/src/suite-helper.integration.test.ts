import { describe, expect, it } from 'vitest';
import { runSuite } from './suite-helper';

describe('runSuite', () => {
  it('should execute valid suite', async () => {
    await expect(
      runSuite({
        time: 200,
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
  });
});
