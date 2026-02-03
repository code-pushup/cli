import { filterItemRefsBy } from './filter.js';

describe('filterItemsWithRefBy', () => {
  it('should return the filtered list based on the given filterFn', () => {
    const list = [
      {
        refs: [
          { plugin: 'a', weight: 1 },
          { plugin: 'b', weight: 1 },
          { plugin: 'c', weight: 1 },
        ],
      },
    ];
    expect(
      filterItemRefsBy(list, ({ plugin }) => plugin === 'a'),
    ).toStrictEqual([
      expect.objectContaining({
        refs: [{ plugin: 'a', weight: 1 }],
      }),
    ]);
  });
});
