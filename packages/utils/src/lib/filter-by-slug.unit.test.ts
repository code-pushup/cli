import { describe, expect, it } from 'vitest';
import {
  filterAuditsBySlug,
  filterGroupsByAuditSlug,
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

  it('should filter if slugs is an array', () => {
    const list = [
      { slug: 'a', title: 'A' },
      { slug: 'b', title: 'B' },
      { slug: 'c', title: 'C' },
    ];
    expect(filterAuditsBySlug(list, ['a'])).toEqual([
      { slug: 'a', title: 'A' },
    ]);
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
    expect(filterGroupsByAuditSlug(list, [])).toEqual([
      {
        slug: 'g',
        title: 'G',
        refs: [
          { slug: 'a', weight: 1 },
          { slug: 'b', weight: 1 },
          { slug: 'c', weight: 1 },
        ],
      },
    ]);
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

  it('should filter if slugs is an array', () => {
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
    expect(filterGroupsByAuditSlug(list, ['a'])).toEqual([
      {
        slug: 'g',
        title: 'G',
        refs: [{ slug: 'a', weight: 1 }],
      },
    ]);
  });
});
