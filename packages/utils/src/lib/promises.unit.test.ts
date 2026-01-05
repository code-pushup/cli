import { describe } from 'vitest';
import { asyncSequential, groupByStatus, settlePromise } from './promises.js';

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
    const work = vi
      .fn()
      .mockImplementation((item: undefined, index: number) =>
        Promise.resolve(index + 1),
      );

    const items = Array.from({ length: 3 });

    const result = await asyncSequential(items, work);
    expect(result).toEqual([1, 2, 3]);
    expect(work).toHaveBeenCalledTimes(3);
    expect(work).toHaveBeenNthCalledWith(1, undefined, 0);
    expect(work).toHaveBeenNthCalledWith(2, undefined, 1);
    expect(work).toHaveBeenNthCalledWith(3, undefined, 2);
  });

  it('should provide array item and index to callback', async () => {
    const callback = vi.fn();
    await expect(
      asyncSequential(['a', 'b', 'c'], callback),
    ).resolves.toBeArrayOfSize(3);
    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenNthCalledWith(1, 'a', 0);
    expect(callback).toHaveBeenNthCalledWith(2, 'b', 1);
    expect(callback).toHaveBeenNthCalledWith(3, 'c', 2);
  });
});

describe('settlePromise', () => {
  it('should wrap resolved value in object with status (as in `Promise.allSettled`)', async () => {
    await expect(settlePromise(Promise.resolve(42))).resolves.toEqual({
      status: 'fulfilled',
      value: 42,
    });
  });

  it('should resolve rejected promise', async () => {
    const error = new Error('something went wrong');
    await expect(settlePromise(Promise.reject(error))).resolves.toEqual({
      status: 'rejected',
      reason: error,
    });
  });
});
