import { describe, expect, it } from 'vitest';
import { filterByAuditSlug, filterBySlug, filterSlug } from './filter-by-slug';

describe('filterSlug', () => {
  it('should return a empty list if no slugs are given', () => {
    const list = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    expect(filterSlug(list, [])).toEqual([]);
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

describe('filterBySlug', () => {
  it('should return the given list if no slugs are given', () => {
    const list = [
      { slug: 'a', title: 'A' },
      { slug: 'b', title: 'B' },
      { slug: 'c', title: 'C' },
    ];
    expect(filterBySlug(list, [])).toEqual(list);
  });

  it('should filter if slugs is a string', () => {
    const list = [
      { slug: 'a', title: 'A' },
      { slug: 'b', title: 'B' },
      { slug: 'c', title: 'C' },
    ];
    expect(filterBySlug(list, 'a')).toEqual([{ slug: 'a', title: 'A' }]);
  });

  it('should filter if slugs is an array', () => {
    const list = [
      { slug: 'a', title: 'A' },
      { slug: 'b', title: 'B' },
      { slug: 'c', title: 'C' },
    ];
    expect(filterBySlug(list, ['a'])).toEqual([{ slug: 'a', title: 'A' }]);
  });
});

describe('filterByAuditSlug', () => {
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
    expect(filterByAuditSlug(list, [])).toEqual([
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
    expect(filterByAuditSlug(list, 'a')).toEqual([
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
    expect(filterByAuditSlug(list, ['a'])).toEqual([
      {
        slug: 'g',
        title: 'G',
        refs: [{ slug: 'a', weight: 1 }],
      },
    ]);
  });
});
