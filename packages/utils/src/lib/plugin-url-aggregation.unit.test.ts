import {
  ContextValidationError,
  addIndex,
  createCategoryRefs,
  expandAuditsForUrls,
  expandCategoryRefs,
  expandGroupsForUrls,
  removeIndex,
  resolveUrlWeight,
  shouldExpandForUrls,
  validateUrlContext,
} from './plugin-url-aggregation';

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
  it('should return weight from context', () => {
    expect(resolveUrlWeight({ 1: 2, 2: 3 }, 0)).toBe(2);
    expect(resolveUrlWeight({ 1: 2, 2: 3 }, 1)).toBe(3);
  });

  it('should fallback to user-defined weight', () => {
    expect(resolveUrlWeight({}, 0, 5)).toBe(5);
    expect(resolveUrlWeight({ 1: 2 }, 1, 4)).toBe(4);
  });

  it('should fallback to 1 if no weight found', () => {
    expect(resolveUrlWeight({}, 0)).toBe(1);
    expect(resolveUrlWeight({ 1: 2 }, 1)).toBe(1);
  });

  it('should prioritize context over user-defined', () => {
    expect(resolveUrlWeight({ 1: 3 }, 0, 5)).toBe(3);
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

  it('should expand audits for multiple URLs', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = expandAuditsForUrls(mockAudits, urls);

    expect(result).toHaveLength(4);
    expect(result.map(({ slug }) => slug)).toEqual([
      'first-contentful-paint-1',
      'largest-contentful-paint-1',
      'first-contentful-paint-2',
      'largest-contentful-paint-2',
    ]);
  });

  it('should update titles with URL identifiers', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = expandAuditsForUrls(mockAudits, urls);

    expect(result[0]?.title).toBe('First Contentful Paint (example.com)');
    expect(result[2]?.title).toBe('First Contentful Paint (example.com/about)');
  });

  it('should preserve other audit properties', () => {
    const auditWithExtra = {
      slug: 'test-audit',
      title: 'Test Audit',
      description: 'Test description',
      docsUrl: 'https://docs.example.com',
    };

    const result = expandAuditsForUrls(
      [auditWithExtra],
      ['https://example.com'],
    );

    expect(result[0]).toEqual({
      slug: 'test-audit-1',
      title: 'Test Audit (example.com)',
      description: 'Test description',
      docsUrl: 'https://docs.example.com',
    });
  });

  it('should handle single URL', () => {
    const result = expandAuditsForUrls(mockAudits, ['https://example.com']);

    expect(result).toHaveLength(2);
    expect(result.map(a => a.slug)).toEqual([
      'first-contentful-paint-1',
      'largest-contentful-paint-1',
    ]);
  });

  it('should handle empty audits array', () => {
    const result = expandAuditsForUrls([], ['https://example.com']);
    expect(result).toHaveLength(0);
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

  it('should expand groups for multiple URLs', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = expandGroupsForUrls(mockGroups, urls);

    expect(result).toHaveLength(4);
    expect(result.map(({ slug }) => slug)).toEqual([
      'performance-1',
      'accessibility-1',
      'performance-2',
      'accessibility-2',
    ]);
  });

  it('should update group titles with URL identifiers', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = expandGroupsForUrls(mockGroups, urls);

    expect(result[0]?.title).toBe('Performance (example.com)');
    expect(result[2]?.title).toBe('Performance (example.com/about)');
  });

  it('should expand refs within groups', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = expandGroupsForUrls(mockGroups, urls);

    expect(result[0]?.refs).toEqual([
      { slug: 'first-contentful-paint-1', weight: 1 },
      { slug: 'largest-contentful-paint-1', weight: 2 },
    ]);

    expect(result[2]?.refs).toEqual([
      { slug: 'first-contentful-paint-2', weight: 1 },
      { slug: 'largest-contentful-paint-2', weight: 2 },
    ]);
  });

  it('should preserve other group properties', () => {
    const groupWithExtra = {
      slug: 'test-group',
      title: 'Test Group',
      description: 'Test description',
      refs: [{ slug: 'test-audit', weight: 1 }],
    };

    const result = expandGroupsForUrls(
      [groupWithExtra],
      ['https://example.com'],
    );

    expect(result[0]).toEqual({
      slug: 'test-group-1',
      title: 'Test Group (example.com)',
      description: 'Test description',
      refs: [{ slug: 'test-audit-1', weight: 1 }],
    });
  });

  it('should handle empty groups array', () => {
    const result = expandGroupsForUrls([], ['https://example.com']);
    expect(result).toHaveLength(0);
  });
});

describe('createCategoryRefs', () => {
  it('should create refs for multiple URLs with expansion', () => {
    expect(
      createCategoryRefs('performance', 'lighthouse', {
        urlCount: 2,
        weights: { 1: 2, 2: 3 },
      }),
    ).toEqual([
      { plugin: 'lighthouse', slug: 'performance-1', type: 'group', weight: 2 },
      { plugin: 'lighthouse', slug: 'performance-2', type: 'group', weight: 3 },
    ]);
  });

  it('should create refs for single URL without expansion', () => {
    expect(
      createCategoryRefs('performance', 'lighthouse', {
        urlCount: 1,
        weights: { 1: 1 },
      }),
    ).toEqual([
      { plugin: 'lighthouse', slug: 'performance', type: 'group', weight: 1 },
    ]);
  });

  it('should use default weight of 1 if not in context', () => {
    const result = createCategoryRefs('performance', 'lighthouse', {
      urlCount: 2,
      weights: {},
    });

    expect(result[0]?.weight).toBe(1);
    expect(result[1]?.weight).toBe(1);
  });
});

describe('expandCategoryRefs', () => {
  it('should expand ref for multiple URLs with slug ordering', () => {
    expect(
      expandCategoryRefs(
        {
          plugin: 'lighthouse',
          slug: 'performance',
          type: 'group',
          weight: 1,
        },
        { urlCount: 2, weights: { 1: 2, 2: 3 } },
      ),
    ).toEqual([
      { plugin: 'lighthouse', slug: 'performance-1', type: 'group', weight: 2 },
      { plugin: 'lighthouse', slug: 'performance-2', type: 'group', weight: 3 },
    ]);
  });

  it('should not expand for single URL', () => {
    expect(
      expandCategoryRefs(
        {
          plugin: 'lighthouse',
          slug: 'performance',
          type: 'group',
          weight: 1,
        },
        { urlCount: 1, weights: { 1: 5 } },
      ),
    ).toEqual([
      { plugin: 'lighthouse', slug: 'performance', type: 'group', weight: 5 },
    ]);
  });

  it('should preserve user-defined weight with fallback to context', () => {
    const result = expandCategoryRefs(
      {
        plugin: 'lighthouse',
        slug: 'performance',
        type: 'group',
        weight: 10,
      },
      { urlCount: 2, weights: { 1: 2, 2: 3 } },
    );

    expect(result[0]?.weight).toBe(2);
    expect(result[1]?.weight).toBe(3);
  });

  it('should work with audit refs', () => {
    expect(
      expandCategoryRefs(
        {
          plugin: 'lighthouse',
          slug: 'fcp',
          type: 'audit',
          weight: 1,
        },
        { urlCount: 2, weights: { 1: 1, 2: 1 } },
      ),
    ).toEqual([
      { plugin: 'lighthouse', slug: 'fcp-1', type: 'audit', weight: 1 },
      { plugin: 'lighthouse', slug: 'fcp-2', type: 'audit', weight: 1 },
    ]);
  });
});

describe('validateUrlContext', () => {
  it('should throw error for invalid context (undefined)', () => {
    expect(() => validateUrlContext(undefined)).toThrow(
      new ContextValidationError('must be an object'),
    );
  });

  it('should throw error for invalid context (missing urlCount)', () => {
    expect(() => validateUrlContext({ weights: {} })).toThrow(
      new ContextValidationError('urlCount must be a non-negative number'),
    );
  });

  it('should throw error for invalid context (negative urlCount)', () => {
    expect(() => validateUrlContext({ urlCount: -1, weights: {} })).toThrow(
      new ContextValidationError('urlCount must be a non-negative number'),
    );
  });

  it('should throw error for invalid context (missing weights)', () => {
    expect(() => validateUrlContext({ urlCount: 2 })).toThrow(
      new ContextValidationError('weights must be an object'),
    );
  });

  it('should throw error for invalid context (mismatched weights count)', () => {
    expect(() =>
      validateUrlContext({ urlCount: 2, weights: { 1: 1 } }),
    ).toThrow(new ContextValidationError('weights count must match urlCount'));
  });

  it('should accept valid context', () => {
    expect(() =>
      validateUrlContext({ urlCount: 2, weights: { 1: 1, 2: 1 } }),
    ).not.toThrow();
  });
});
