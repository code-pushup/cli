import {
  addIndex,
  expandAuditsForUrls,
  expandCategoryRefs,
  expandGroupsForUrls,
  extractGroupSlugs,
  removeIndex,
  resolveUrlWeight,
  shouldExpandForUrls,
} from './plugin-url-aggregation.js';

describe('shouldExpandForUrls', () => {
  it.each([
    [false, 0],
    [false, 1],
    [true, 2],
    [true, 3],
    [true, 10],
  ])('should return %j for urlCount %d', (expected, urlCount) => {
    expect(shouldExpandForUrls(urlCount)).toBe(expected);
  });
});

describe('addIndex', () => {
  it.each([
    [0, 'performance', 'performance-1'],
    [1, 'performance', 'performance-2'],
    [2, 'best-practices', 'best-practices-3'],
    [1, 'cumulative-layout-shift', 'cumulative-layout-shift-2'],
  ])('should append index %d + 1 to slug %j', (index, slug, expected) => {
    expect(addIndex(slug, index)).toBe(expected);
  });
});

describe('removeIndex', () => {
  it.each([
    ['performance-1', 'performance'],
    ['performance-2', 'performance'],
    ['best-practices-10', 'best-practices'],
    ['performance', 'performance'],
    ['my-slug', 'my-slug'],
  ])('should remove suffix from %j to get %j', (input, expected) => {
    expect(removeIndex(input)).toBe(expected);
  });
});

describe('resolveUrlWeight', () => {
  it('should return URL weight when no user weight provided', () => {
    expect(resolveUrlWeight({ 1: 2, 2: 3 }, 0)).toBe(2);
    expect(resolveUrlWeight({ 1: 2, 2: 3 }, 1)).toBe(3);
  });

  it('should fallback to 1 when no URL weight and no user weight', () => {
    expect(resolveUrlWeight({}, 0)).toBe(1);
    expect(resolveUrlWeight({ 1: 2 }, 1)).toBe(1);
  });

  it('should average URL and user weights when both provided', () => {
    expect(resolveUrlWeight({ 1: 3 }, 0, 5)).toBe(4);
    expect(resolveUrlWeight({ 1: 2, 2: 3 }, 0, 4)).toBe(3);
    expect(resolveUrlWeight({ 1: 2, 2: 3 }, 1, 4)).toBe(3.5);
  });

  it('should average with fallback URL weight of 1 when URL weight missing', () => {
    expect(resolveUrlWeight({}, 0, 5)).toBe(3);
    expect(resolveUrlWeight({ 1: 2 }, 1, 4)).toBe(2.5);
  });
});

describe('expandAuditsForUrls', () => {
  const mockAudits = [
    {
      slug: 'first-contentful-paint',
      title: 'First Contentful Paint',
      description: 'Measures FCP',
    },
    {
      slug: 'largest-contentful-paint',
      title: 'Largest Contentful Paint',
      description: 'Measures LCP',
    },
  ];

  it('should expand audits for multiple URLs with updated slugs and titles', () => {
    expect(
      expandAuditsForUrls(mockAudits, [
        'https://example.com',
        'https://example.com/about',
      ]),
    ).toStrictEqual([
      {
        slug: 'first-contentful-paint-1',
        title: 'First Contentful Paint (example.com)',
        description: 'Measures FCP',
      },
      {
        slug: 'largest-contentful-paint-1',
        title: 'Largest Contentful Paint (example.com)',
        description: 'Measures LCP',
      },
      {
        slug: 'first-contentful-paint-2',
        title: 'First Contentful Paint (example.com/about)',
        description: 'Measures FCP',
      },
      {
        slug: 'largest-contentful-paint-2',
        title: 'Largest Contentful Paint (example.com/about)',
        description: 'Measures LCP',
      },
    ]);
  });

  it('should preserve other audit properties', () => {
    expect(
      expandAuditsForUrls(
        [
          {
            slug: 'test-audit',
            title: 'Test Audit',
            description: 'Test description',
            docsUrl: 'https://docs.example.com',
          },
        ],
        ['https://example.com'],
      ),
    ).toStrictEqual([
      {
        slug: 'test-audit-1',
        title: 'Test Audit (example.com)',
        description: 'Test description',
        docsUrl: 'https://docs.example.com',
      },
    ]);
  });

  it('should handle single URL', () => {
    expect(
      expandAuditsForUrls(mockAudits, ['https://example.com']),
    ).toStrictEqual([
      {
        slug: 'first-contentful-paint-1',
        title: 'First Contentful Paint (example.com)',
        description: 'Measures FCP',
      },
      {
        slug: 'largest-contentful-paint-1',
        title: 'Largest Contentful Paint (example.com)',
        description: 'Measures LCP',
      },
    ]);
  });

  it('should handle empty audits array', () => {
    expect(expandAuditsForUrls([], ['https://example.com'])).toBeEmpty();
  });
});

describe('expandGroupsForUrls', () => {
  const mockGroups = [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [
        { slug: 'first-contentful-paint', weight: 1 },
        { slug: 'largest-contentful-paint', weight: 2 },
      ],
    },
    {
      slug: 'accessibility',
      title: 'Accessibility',
      refs: [{ slug: 'color-contrast', weight: 1 }],
    },
  ];

  it('should expand groups for multiple URLs with updated slugs, titles and refs', () => {
    expect(
      expandGroupsForUrls(mockGroups, [
        'https://example.com',
        'https://example.com/about',
      ]),
    ).toStrictEqual([
      {
        slug: 'performance-1',
        title: 'Performance (example.com)',
        refs: [
          { slug: 'first-contentful-paint-1', weight: 1 },
          { slug: 'largest-contentful-paint-1', weight: 2 },
        ],
      },
      {
        slug: 'accessibility-1',
        title: 'Accessibility (example.com)',
        refs: [{ slug: 'color-contrast-1', weight: 1 }],
      },
      {
        slug: 'performance-2',
        title: 'Performance (example.com/about)',
        refs: [
          { slug: 'first-contentful-paint-2', weight: 1 },
          { slug: 'largest-contentful-paint-2', weight: 2 },
        ],
      },
      {
        slug: 'accessibility-2',
        title: 'Accessibility (example.com/about)',
        refs: [{ slug: 'color-contrast-2', weight: 1 }],
      },
    ]);
  });

  it('should preserve other group properties', () => {
    expect(
      expandGroupsForUrls(
        [
          {
            slug: 'test-group',
            title: 'Test Group',
            description: 'Test description',
            refs: [{ slug: 'test-audit', weight: 1 }],
          },
        ],
        ['https://example.com'],
      ),
    ).toStrictEqual([
      {
        slug: 'test-group-1',
        title: 'Test Group (example.com)',
        description: 'Test description',
        refs: [{ slug: 'test-audit-1', weight: 1 }],
      },
    ]);
  });

  it('should handle empty groups array', () => {
    expect(expandGroupsForUrls([], ['https://example.com'])).toBeEmpty();
  });
});

describe('expandCategoryRefs', () => {
  it('should average URL and user weights for multiple URLs', () => {
    expect(
      expandCategoryRefs(
        { plugin: 'lighthouse', slug: 'performance', type: 'group', weight: 1 },
        { urlCount: 2, weights: { 1: 2, 2: 3 } },
      ),
    ).toStrictEqual([
      {
        plugin: 'lighthouse',
        slug: 'performance-1',
        type: 'group',
        weight: 1.5,
      },
      { plugin: 'lighthouse', slug: 'performance-2', type: 'group', weight: 2 },
    ]);
  });

  it('should average URL and user weights for single URL', () => {
    expect(
      expandCategoryRefs(
        { plugin: 'lighthouse', slug: 'performance', type: 'group', weight: 1 },
        { urlCount: 1, weights: { 1: 5 } },
      ),
    ).toStrictEqual([
      { plugin: 'lighthouse', slug: 'performance', type: 'group', weight: 3 },
    ]);
  });

  it('should use URL weights when user-defined weight is undefined', () => {
    expect(
      expandCategoryRefs(
        { plugin: 'lighthouse', slug: 'performance', type: 'group' },
        { urlCount: 2, weights: { 1: 2, 2: 3 } },
      ),
    ).toStrictEqual([
      { plugin: 'lighthouse', slug: 'performance-1', type: 'group', weight: 2 },
      { plugin: 'lighthouse', slug: 'performance-2', type: 'group', weight: 3 },
    ]);
  });

  it('should work with audit refs', () => {
    expect(
      expandCategoryRefs(
        { plugin: 'lighthouse', slug: 'fcp', type: 'audit', weight: 1 },
        { urlCount: 2, weights: { 1: 1, 2: 1 } },
      ),
    ).toStrictEqual([
      { plugin: 'lighthouse', slug: 'fcp-1', type: 'audit', weight: 1 },
      { plugin: 'lighthouse', slug: 'fcp-2', type: 'audit', weight: 1 },
    ]);
  });
});

describe('extractGroupSlugs', () => {
  it('should extract unique base slugs from ordered groups', () => {
    expect(
      extractGroupSlugs([
        { slug: 'performance-1', title: 'Performance 1', refs: [] },
        { slug: 'performance-2', title: 'Performance 2', refs: [] },
        { slug: 'accessibility-1', title: 'Accessibility 1', refs: [] },
        { slug: 'accessibility-2', title: 'Accessibility 2', refs: [] },
      ]),
    ).toEqual(['performance', 'accessibility']);
  });

  it('should handle non-ordered groups', () => {
    expect(
      extractGroupSlugs([
        { slug: 'performance', title: 'Performance', refs: [] },
        { slug: 'accessibility', title: 'Accessibility', refs: [] },
      ]),
    ).toEqual(['performance', 'accessibility']);
  });

  it('should handle mixed ordered and non-ordered groups', () => {
    expect(
      extractGroupSlugs([
        { slug: 'performance', title: 'Performance', refs: [] },
        { slug: 'accessibility-1', title: 'Accessibility 1', refs: [] },
        { slug: 'accessibility-2', title: 'Accessibility 2', refs: [] },
      ]),
    ).toEqual(['performance', 'accessibility']);
  });

  it('should return unique slugs only', () => {
    expect(
      extractGroupSlugs([
        { slug: 'performance-1', title: 'Performance 1', refs: [] },
        { slug: 'performance-2', title: 'Performance 2', refs: [] },
        { slug: 'performance-3', title: 'Performance 3', refs: [] },
      ]),
    ).toEqual(['performance']);
  });

  it('should handle empty groups array', () => {
    expect(extractGroupSlugs([])).toBeEmpty();
  });
});
