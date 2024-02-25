import { describe, expect, it } from 'vitest';
import { filterBy, filterItemRefsBy } from './filter';

describe('filterBy', () => {
  it('should return same items if no filterFn is given', () => {
    const items = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    expect(filterBy(items)).toEqual(items);
  });

  it('should return same items if empty items are given', () => {
    const list: { slug: string }[] = [];
    expect(filterBy(list, r => !!r)).toBe(list);
  });

  it('should return an empty list if no slugs are matching', () => {
    const list = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    // test bad case:
    // 'aa'.includes('a') // fail
    // ['aa'].includes('a') // passes
    expect(filterBy(list, ({ slug }) => slug === 'aa')).toEqual([]);
  });
});

describe('filterItemsWithRefBy', () => {
  it('should return the given list if no slugs are given', () => {
    const list = [
      {
        refs: [
          { slug: 'a', weight: 1 },
          { slug: 'b', weight: 1 },
          { slug: 'c', weight: 1 },
        ],
      },
    ];
    expect(filterItemRefsBy<{ slug: string }>(list)).toEqual(list);
  });

  it('should return the filtered list if filterFn is given', () => {
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
      filterItemRefsBy<{ plugin: string }>(
        list,
        ({ plugin }) => plugin === 'a',
      ),
    ).toStrictEqual([
      expect.objectContaining({
        refs: [{ plugin: 'a', weight: 1 }],
      }),
    ]);
  });
});
