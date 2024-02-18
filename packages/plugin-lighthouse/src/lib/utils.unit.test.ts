import { expect } from 'vitest';
import {
  AuditsNotImplementedError,
  CategoriesNotImplementedError,
  filterAuditsAndGroupsByOnlyOptions,
  getLighthouseCliArguments,
  validateOnlyAudits,
  validateOnlyCategories,
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

describe('validateOnlyAudits', () => {
  it('should not throw for audit slugs existing in given audits', () => {
    expect(
      validateOnlyAudits(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        'a',
      ),
    ).toBeTruthy();
  });

  it('should throw if given onlyAudits do not exist', () => {
    expect(() =>
      validateOnlyAudits(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        'missing-audit',
      ),
    ).toThrow(new AuditsNotImplementedError(['missing-audit']));
  });
});

describe('validateOnlyCategories', () => {
  it('should not throw for category slugs existing in given categories', () => {
    expect(
      validateOnlyCategories(
        [
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
        ],
        'g2',
      ),
    ).toBeTruthy();
  });

  it('should throw if given onlyCategories do not exist', () => {
    expect(() =>
      validateOnlyCategories(
        [
          {
            slug: 'g1',
            title: 'G 1',
            refs: [
              { slug: 'a', weight: 1 },
              { slug: 'b', weight: 1 },
              { slug: 'c', weight: 1 },
            ],
          },
        ],
        'missing-category',
      ),
    ).toThrow(new CategoriesNotImplementedError(['missing-category']));
  });
});

describe('filterAuditsAndGroupsByOnlyOptions', () => {
  it('should return given audits and groups if no only filter is set', () => {
    const audits = [
      { slug: 'a', title: 'A' },
      { slug: 'b', title: 'B' },
      { slug: 'c', title: 'C' },
    ];
    const groups = [
      {
        slug: 'g1',
        title: 'G 1',
        refs: [
          { slug: 'a', weight: 1 },
          { slug: 'b', weight: 1 },
          { slug: 'c', weight: 1 },
        ],
      },
    ];
    expect(
      filterAuditsAndGroupsByOnlyOptions(audits, groups, {}),
    ).toStrictEqual({ audits, groups });
  });

  it('should filter audits if onlyAudits is set', () => {
    expect(
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        [
          {
            slug: 'g1',
            title: 'G 1',
            refs: [
              { slug: 'a', weight: 1 },
              { slug: 'b', weight: 1 },
              { slug: 'c', weight: 1 },
            ],
          },
        ],
        { onlyAudits: ['a'] },
      ),
    ).toStrictEqual({
      audits: [{ slug: 'a', title: 'A' }],
      groups: [
        {
          slug: 'g1',
          title: 'G 1',
          refs: [{ slug: 'a', weight: 1 }],
        },
      ],
    });
  });

  it('should throw if onlyAudits is set with a missing audit slug', () => {
    expect(
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        [
          {
            slug: 'g1',
            title: 'G 1',
            refs: [
              { slug: 'a', weight: 1 },
              { slug: 'b', weight: 1 },
              { slug: 'c', weight: 1 },
            ],
          },
        ],
        { onlyAudits: ['a'] },
      ),
    ).toStrictEqual({
      audits: [{ slug: 'a', title: 'A' }],
      groups: [
        {
          slug: 'g1',
          title: 'G 1',
          refs: [{ slug: 'a', weight: 1 }],
        },
      ],
    });
  });

  it('should filter categories if onlyCategories is set', () => {
    expect(
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
          { slug: 'd', title: 'D' },
          { slug: 'e', title: 'E' },
          { slug: 'f', title: 'F' },
        ],
        [
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
        ],
        { onlyCategories: ['g2'] },
      ),
    ).toStrictEqual({
      audits: [
        { slug: 'd', title: 'D' },
        { slug: 'e', title: 'E' },
        { slug: 'f', title: 'F' },
      ],
      groups: [
        {
          slug: 'g2',
          title: 'G 2',
          refs: [
            { slug: 'd', weight: 1 },
            { slug: 'e', weight: 1 },
            { slug: 'f', weight: 1 },
          ],
        },
      ],
    });
  });

  it('should ignore onlyAudits and only filter categories if onlyCategories and onlyAudits is set', () => {
    expect(
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
          { slug: 'd', title: 'D' },
          { slug: 'e', title: 'E' },
          { slug: 'f', title: 'F' },
        ],
        [
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
        ],
        {
          onlyAudits: ['a'],
          onlyCategories: ['g2'],
        },
      ),
    ).toStrictEqual({
      audits: [
        { slug: 'd', title: 'D' },
        { slug: 'e', title: 'E' },
        { slug: 'f', title: 'F' },
      ],
      groups: [
        {
          slug: 'g2',
          title: 'G 2',
          refs: [
            { slug: 'd', weight: 1 },
            { slug: 'e', weight: 1 },
            { slug: 'f', weight: 1 },
          ],
        },
      ],
    });
  });

  it('should throw if onlyAudits is set with a audit slug that is not implemented', () => {
    expect(() =>
      filterAuditsAndGroupsByOnlyOptions(
        [{ slug: 'a', title: 'A' }],
        [
          {
            slug: 'g1',
            title: 'G 1',
            refs: [{ slug: 'a', weight: 1 }],
          },
        ],
        {
          onlyAudits: ['missing-audit'],
        },
      ),
    ).toThrow(new AuditsNotImplementedError(['missing-audit']));
  });

  it('should throw if onlyCategories is set with a category slug that is not implemented', () => {
    expect(() =>
      filterAuditsAndGroupsByOnlyOptions(
        [{ slug: 'a', title: 'A' }],
        [
          {
            slug: 'g1',
            title: 'G 1',
            refs: [{ slug: 'a', weight: 1 }],
          },
        ],
        {
          onlyCategories: ['missing-category'],
        },
      ),
    ).toThrow(new CategoriesNotImplementedError(['missing-category']));
  });
});
