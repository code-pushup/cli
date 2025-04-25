import { describe } from 'vitest';
import { asyncSequential, groupByStatus } from './promises.js';

describe('groupByStatus', () => {
  it('should group results by status', () => {
    const results = [
      { status: 'fulfilled', value: 'first' },
      { status: 'rejected', reason: 'second' },
      { status: 'fulfilled', value: 'third' },
    ] as PromiseSettledResult<string>[];
    const grouped = groupByStatus(results);
    expect(grouped).toEqual({
      fulfilled: [
        { status: 'fulfilled', value: 'first' },
        { status: 'fulfilled', value: 'third' },
      ],
      rejected: [{ status: 'rejected', reason: 'second' }],
    });
  });
});

describe('asyncSequential', () => {
  it('should map async function to array', async () => {
    await expect(
      asyncSequential(['a', 'b', 'c'], x => Promise.resolve(x.toUpperCase())),
    ).resolves.toEqual(['A', 'B', 'C']);
  });

  it('should wait for previous item to resolve before processing next item', async () => {
    let counter = 0;
    const work = vi.fn().mockImplementation(
      () =>
        new Promise(resolve => {
          counter++;
          setTimeout(() => {
            resolve(counter);
          }, 10);
        }),
    );

    const items = Array.from({ length: 4 });

    await expect(asyncSequential(items, work)).resolves.toEqual([1, 2, 3, 4]);

    counter = 0;
    const sequentialResult = await asyncSequential(items, work); // [1, 2, 3, 4]
    counter = 0;
    const parallelResult = await Promise.all(items.map(work)); // [4, 4, 4, 4]

    expect(sequentialResult).not.toEqual(parallelResult);
  });
});
