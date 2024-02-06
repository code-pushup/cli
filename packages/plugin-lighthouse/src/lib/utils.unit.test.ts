import { describe, expect, it } from 'vitest';
import {
  filterByAuditSlug,
  filterBySlug,
  getLighthouseCliArguments,
} from './utils';

describe('getLighthouseCliArguments', () => {
  it('should parse valid options', () => {
    expect(
      getLighthouseCliArguments({
        url: ['https://code-pushup-portal.com'],
      }),
    ).toEqual(expect.arrayContaining(['https://code-pushup-portal.com']));
  });

  it('should parse chrome-flags options correctly', () => {
    const args = getLighthouseCliArguments({
      url: ['https://code-pushup-portal.com'],
      chromeFlags: { headless: 'new', 'user-data-dir': 'test' },
    });
    expect(args).toEqual(
      expect.arrayContaining([
        '--chromeFlags="--headless=new --user-data-dir=test"',
      ]),
    );
  });
});

describe('filterBySlug', () => {
  it('should return the given list if no slugs are given', () => {
    const list = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    expect(filterBySlug(list, [])).toEqual(list);
  });

  it('should filter if slugs is a string', () => {
    const list = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    expect(filterBySlug(list, 'a')).toEqual([{ slug: 'a' }]);
  });

  it('should filter if slugs is an array', () => {
    const list = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    expect(filterBySlug(list, ['a'])).toEqual([{ slug: 'a' }]);
  });
});

describe('filterByAuditSlug', () => {
  it('should return the given list if no slugs are given', () => {
    const list = [
      {
        refs: [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }],
      },
    ];
    expect(filterByAuditSlug(list, [])).toEqual([
      {
        refs: [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }],
      },
    ]);
  });

  it('should filter if slugs is a string', () => {
    const list = [
      {
        refs: [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }],
      },
    ];
    expect(filterByAuditSlug(list, 'a')).toEqual([
      {
        refs: [{ slug: 'a' }],
      },
    ]);
  });

  it('should filter if slugs is an array', () => {
    const list = [
      {
        refs: [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }],
      },
    ];
    expect(filterByAuditSlug(list, ['a'])).toEqual([
      {
        refs: [{ slug: 'a' }],
      },
    ]);
  });
});
