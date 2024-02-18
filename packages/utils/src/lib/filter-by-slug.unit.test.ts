import { describe, expect, it } from 'vitest';
import {
  filterAuditsBySlug,
  filterGroupsByAuditSlug,
  filterGroupsByCategorySlug,
  filterSlug,
} from './filter-by-slug';

describe('filterSlug', () => {
  it('should return an empty list if no slugs are given', () => {
    const list = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    expect(filterSlug(list, [])).toEqual([]);
  });

  it('should return an empty list if no slugs are matching', () => {
    const list = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    // test bad case:
    // 'aa'.includes('a') // fail
    // ['aa'].includes('a') // passes
    expect(filterSlug(list, 'aa')).toEqual([]);
  });

  it('should filter if slugs is a string', () => {
    const list = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    expect(filterSlug(list, 'a')).toEqual([{ slug: 'a' }]);
  });

  it('should filter if slugs is an array', () => {
    const list = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    expect(filterSlug(list, ['a'])).toEqual([{ slug: 'a' }]);
  });
});

describe('filterAuditsBySlug', () => {
  it('should return the given list if no slugs are given', () => {
    const list = [
      { slug: 'a', title: 'A' },
      { slug: 'b', title: 'B' },
      { slug: 'c', title: 'C' },
    ];
    expect(filterAuditsBySlug(list, [])).toEqual(list);
  });

  it('should filter if slugs is a string', () => {
    const list = [
      { slug: 'a', title: 'A' },
      { slug: 'b', title: 'B' },
      { slug: 'c', title: 'C' },
    ];
    expect(filterAuditsBySlug(list, 'a')).toEqual([{ slug: 'a', title: 'A' }]);
  });
});

describe('filterGroupsByAuditSlug', () => {
  it('should return the given list if no slugs are given', () => {
    const list = [
      {
        slug: 'g',
        title: 'G',
        refs: [
          { slug: 'a', weight: 1 },
          { slug: 'b', weight: 1 },
          { slug: 'c', weight: 1 },
        ],
      },
    ];
    expect(filterGroupsByAuditSlug(list, [])).toEqual(list);
  });

  it('should filter if slugs is a string', () => {
    const list = [
      {
        slug: 'g',
        title: 'G',
        refs: [
          { slug: 'a', weight: 1 },
          { slug: 'b', weight: 1 },
          { slug: 'c', weight: 1 },
        ],
      },
    ];
    expect(filterGroupsByAuditSlug(list, 'a')).toEqual([
      {
        slug: 'g',
        title: 'G',
        refs: [{ slug: 'a', weight: 1 }],
      },
    ]);
  });
});

describe('filterGroupsByCategorySlug', () => {
  it('should return the given groups if no slugs are given', () => {
    const list = [
      {
        slug: 'g',
        title: 'G',
        refs: [
          { slug: 'a', weight: 1 },
          { slug: 'b', weight: 1 },
          { slug: 'c', weight: 1 },
        ],
      },
    ];
    expect(filterGroupsByCategorySlug(list, [])).toEqual(list);
  });

  it('should filter groups if slugs is a string', () => {
    const list = [
      {
        slug: 'g1',
        title: 'G 1',
        refs: [
          { slug: 'a', weight: 1 },
          { slug: 'b', weight: 1 },
          { slug: 'c', weight: 1 },
        ],
      },
      {
        slug: 'g2',
        title: 'G 2',
        refs: [
          { slug: 'd', weight: 1 },
          { slug: 'e', weight: 1 },
          { slug: 'f', weight: 1 },
        ],
      },
    ];
    expect(filterGroupsByCategorySlug(list, 'g2')).toEqual([
      {
        slug: 'g2',
        title: 'G 2',
        refs: [
          { slug: 'd', weight: 1 },
          { slug: 'e', weight: 1 },
          { slug: 'f', weight: 1 },
        ],
      },
    ]);
  });
});
