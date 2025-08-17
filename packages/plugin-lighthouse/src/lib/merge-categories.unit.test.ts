import { describe, expect, it } from 'vitest';
import type { CategoryConfig } from '@code-pushup/models';
import { LIGHTHOUSE_PLUGIN_SLUG } from './constants.js';
import {
  ContextValidationError,
  createAggregatedCategory,
  expandAggregatedCategory,
  extractGroupSlugs,
  mergeLighthouseCategories,
  validateContext,
} from './merge-categories.js';

describe('mergeLighthouseCategories', () => {
  const mockMultiUrlPlugin = {
    groups: [
      {
        slug: 'performance-1',
        title: 'Performance (example.com)',
        refs: [{ slug: 'first-contentful-paint-1', weight: 1 }],
      },
      {
        slug: 'accessibility-1',
        title: 'Accessibility (example.com)',
        refs: [{ slug: 'color-contrast-1', weight: 1 }],
      },
      {
        slug: 'performance-2',
        title: 'Performance (example.com/about)',
        refs: [{ slug: 'first-contentful-paint-2', weight: 1 }],
      },
      {
        slug: 'accessibility-2',
        title: 'Accessibility (example.com/about)',
        refs: [{ slug: 'color-contrast-2', weight: 1 }],
      },
    ],
    context: {
      urlCount: 2,
      weights: { 1: 1, 2: 1 },
    },
  };

  const mockUserCategories: CategoryConfig[] = [
    {
      slug: 'performance',
      title: 'Website Performance',
      description: 'Measures how fast your website loads',
      refs: [
        {
          type: 'group',
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'performance',
          weight: 2,
        },
      ],
    },
    {
      slug: 'a11y',
      title: 'Accessibility',
      refs: [
        {
          type: 'group',
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'accessibility',
          weight: 1,
        },
      ],
    },
  ];

  describe('with no groups', () => {
    it('should return empty array when no groups and no categories provided', () => {
      expect(mergeLighthouseCategories({ groups: undefined })).toEqual([]);
    });

    it('should return provided categories when no groups provided', () => {
      expect(
        mergeLighthouseCategories({ groups: undefined }, mockUserCategories),
      ).toEqual(mockUserCategories);
    });
  });

  describe('with single URL', () => {
    const plugin = {
      groups: [
        {
          slug: 'performance',
          title: 'Performance',
          refs: [{ slug: 'first-contentful-paint', weight: 1 }],
        },
        {
          slug: 'accessibility',
          title: 'Accessibility',
          refs: [{ slug: 'color-contrast', weight: 1 }],
        },
      ],
      context: {
        urlCount: 1,
        weights: { 1: 1 },
      },
    };

    it('should return empty array when no categories provided', () => {
      expect(mergeLighthouseCategories(plugin)).toEqual([]);
    });

    it('should return provided categories unchanged', () => {
      expect(mergeLighthouseCategories(plugin, mockUserCategories)).toEqual(
        mockUserCategories,
      );
    });
  });

  describe('with multiple URLs', () => {
    it('should create default aggregated categories when no categories provided', () => {
      const result = mergeLighthouseCategories(mockMultiUrlPlugin);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        slug: 'performance',
        title: 'Performance',
        refs: [
          {
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'performance-1',
            type: 'group',
            weight: 1,
          },
          {
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'performance-2',
            type: 'group',
            weight: 1,
          },
        ],
      });
      expect(result[1]).toEqual({
        slug: 'accessibility',
        title: 'Accessibility',
        description: expect.any(String),
        refs: [
          {
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'accessibility-1',
            type: 'group',
            weight: 1,
          },
          {
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'accessibility-2',
            type: 'group',
            weight: 1,
          },
        ],
      });
    });

    it('should expand user-provided categories', () => {
      const result = mergeLighthouseCategories(
        mockMultiUrlPlugin,
        mockUserCategories,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        slug: 'performance',
        title: 'Website Performance',
        description: 'Measures how fast your website loads',
        refs: [
          {
            type: 'group',
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'performance-1',
            weight: 1,
          },
          {
            type: 'group',
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'performance-2',
            weight: 1,
          },
        ],
      });
      expect(result[1]).toEqual({
        slug: 'a11y',
        title: 'Accessibility',
        refs: [
          {
            type: 'group',
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'accessibility-1',
            weight: 1,
          },
          {
            type: 'group',
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'accessibility-2',
            weight: 1,
          },
        ],
      });
    });

    it('should handle mixed group and audit refs', () => {
      expect(
        mergeLighthouseCategories(mockMultiUrlPlugin, [
          {
            slug: 'mixed-performance',
            title: 'Mixed Performance',
            refs: [
              {
                type: 'group',
                plugin: LIGHTHOUSE_PLUGIN_SLUG,
                slug: 'performance',
                weight: 1,
              },
              {
                type: 'audit',
                plugin: LIGHTHOUSE_PLUGIN_SLUG,
                slug: 'first-contentful-paint',
                weight: 2,
              },
            ],
          },
        ])[0]?.refs,
      ).toEqual([
        {
          type: 'group',
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'performance-1',
          weight: 1,
        },
        {
          type: 'group',
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'performance-2',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'first-contentful-paint-1',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'first-contentful-paint-2',
          weight: 1,
        },
      ]);
    });

    it('should preserve non-Lighthouse refs unchanged', () => {
      expect(
        mergeLighthouseCategories(mockMultiUrlPlugin, [
          {
            slug: 'mixed-category',
            title: 'Mixed Category',
            refs: [
              {
                type: 'group',
                plugin: LIGHTHOUSE_PLUGIN_SLUG,
                slug: 'performance',
                weight: 1,
              },
              { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
              {
                type: 'audit',
                plugin: 'other-plugin',
                slug: 'some-audit',
                weight: 1,
              },
            ],
          },
        ])[0]?.refs,
      ).toEqual([
        {
          type: 'group',
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'performance-1',
          weight: 1,
        },
        {
          type: 'group',
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'performance-2',
          weight: 1,
        },
        { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
        {
          type: 'audit',
          plugin: 'other-plugin',
          slug: 'some-audit',
          weight: 1,
        },
      ]);
    });

    it('should handle categories without Lighthouse refs', () => {
      const categories: CategoryConfig[] = [
        {
          slug: 'code-quality',
          title: 'Code Quality',
          refs: [
            { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
            {
              type: 'group',
              plugin: 'typescript',
              slug: 'type-issues',
              weight: 1,
            },
          ],
        },
      ];

      expect(
        mergeLighthouseCategories(mockMultiUrlPlugin, categories)[0],
      ).toEqual(categories[0]);
    });

    it('should preserve all category properties', () => {
      expect(
        mergeLighthouseCategories(mockMultiUrlPlugin, [
          {
            slug: 'performance',
            title: 'Performance',
            description: 'Website performance metrics',
            docsUrl: 'https://docs.example.com/performance',
            isBinary: true,
            refs: [
              {
                type: 'group',
                plugin: LIGHTHOUSE_PLUGIN_SLUG,
                slug: 'performance',
                weight: 1,
              },
            ],
          },
        ])[0],
      ).toEqual({
        slug: 'performance',
        title: 'Performance',
        description: 'Website performance metrics',
        docsUrl: 'https://docs.example.com/performance',
        isBinary: true,
        refs: [
          {
            type: 'group',
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'performance-1',
            weight: 1,
          },
          {
            type: 'group',
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'performance-2',
            weight: 1,
          },
        ],
      });
    });
  });

  describe('URL count detection', () => {
    it('should handle 3 URLs correctly', () => {
      const plugin = {
        groups: [
          { slug: 'performance-1', title: 'Performance 1', refs: [] },
          { slug: 'performance-2', title: 'Performance 2', refs: [] },
          { slug: 'performance-3', title: 'Performance 3', refs: [] },
        ],
        context: { urlCount: 3, weights: { 1: 1, 2: 1, 3: 1 } },
      };

      const categories: CategoryConfig[] = [
        {
          slug: 'performance',
          title: 'Performance',
          refs: [
            {
              type: 'group',
              plugin: LIGHTHOUSE_PLUGIN_SLUG,
              slug: 'performance',
              weight: 1,
            },
          ],
        },
      ];

      const result = mergeLighthouseCategories(plugin, categories);

      expect(result[0]?.refs).toHaveLength(3);
      expect(result[0]?.refs.map(({ slug }) => slug)).toEqual([
        'performance-1',
        'performance-2',
        'performance-3',
      ]);
    });

    it('should filter out invalid Lighthouse groups', () => {
      const result = mergeLighthouseCategories({
        groups: [
          { slug: 'performance-1', title: 'Performance 1', refs: [] },
          { slug: 'invalid-group-1', title: 'Invalid Group 1', refs: [] },
          { slug: 'accessibility-1', title: 'Accessibility 1', refs: [] },
          { slug: 'another-invalid-1', title: 'Another Invalid 1', refs: [] },
          { slug: 'performance-2', title: 'Performance 2', refs: [] },
          { slug: 'invalid-group-2', title: 'Invalid Group 2', refs: [] },
          { slug: 'accessibility-2', title: 'Accessibility 2', refs: [] },
          { slug: 'another-invalid-2', title: 'Another Invalid 2', refs: [] },
        ],
        context: { urlCount: 2, weights: { 1: 1, 2: 1 } },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        slug: 'performance',
        title: 'Performance',
        refs: [
          {
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'performance-1',
            type: 'group',
            weight: 1,
          },
          {
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'performance-2',
            type: 'group',
            weight: 1,
          },
        ],
      });
      expect(result[1]).toEqual({
        slug: 'accessibility',
        title: 'Accessibility',
        description: expect.any(String),
        refs: [
          {
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'accessibility-1',
            type: 'group',
            weight: 1,
          },
          {
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'accessibility-2',
            type: 'group',
            weight: 1,
          },
        ],
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty categories array', () => {
      expect(mergeLighthouseCategories(mockMultiUrlPlugin, [])).toEqual([]);
    });

    it('should handle plugin with empty groups array', () => {
      expect(
        mergeLighthouseCategories(
          { groups: [], context: { urlCount: 0, weights: {} } },
          mockUserCategories,
        ),
      ).toEqual(mockUserCategories);
    });

    it('should handle categories with empty refs', () => {
      const category: CategoryConfig[] = [
        {
          slug: 'empty-category',
          title: 'Empty Category',
          refs: [],
        },
      ];

      expect(
        mergeLighthouseCategories(mockMultiUrlPlugin, category)[0],
      ).toEqual(category[0]);
    });
  });
});

describe('extractGroupSlugs', () => {
  it('should extract unique base slugs from ordered groups', () => {
    const groups = [
      { slug: 'performance-1', title: 'Performance 1', refs: [] },
      { slug: 'performance-2', title: 'Performance 2', refs: [] },
      { slug: 'accessibility-1', title: 'Accessibility 1', refs: [] },
      { slug: 'accessibility-2', title: 'Accessibility 2', refs: [] },
    ];
    expect(extractGroupSlugs(groups)).toEqual(['performance', 'accessibility']);
  });

  it('should handle non-ordered groups', () => {
    const groups = [
      { slug: 'performance', title: 'Performance', refs: [] },
      { slug: 'accessibility', title: 'Accessibility', refs: [] },
    ];
    expect(extractGroupSlugs(groups)).toEqual(['performance', 'accessibility']);
  });

  it('should handle mixed ordered and non-ordered groups', () => {
    const groups = [
      { slug: 'performance', title: 'Performance', refs: [] },
      { slug: 'accessibility-1', title: 'Accessibility 1', refs: [] },
      { slug: 'accessibility-2', title: 'Accessibility 2', refs: [] },
    ];
    expect(extractGroupSlugs(groups)).toEqual(['performance', 'accessibility']);
  });

  it('should return unique slugs only', () => {
    const groups = [
      { slug: 'performance-1', title: 'Performance 1', refs: [] },
      { slug: 'performance-2', title: 'Performance 2', refs: [] },
      { slug: 'performance-3', title: 'Performance 3', refs: [] },
    ];
    expect(extractGroupSlugs(groups)).toEqual(['performance']);
  });

  it('should handle empty groups array', () => {
    expect(extractGroupSlugs([])).toEqual([]);
  });
});

describe('createAggregatedCategory', () => {
  it("should create category with Lighthouse groups' refs", () => {
    expect(
      createAggregatedCategory('performance', {
        urlCount: 2,
        weights: { 1: 1, 2: 1 },
      }),
    ).toEqual({
      slug: 'performance',
      title: 'Performance',
      refs: [
        {
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'performance-1',
          type: 'group',
          weight: 1,
        },
        {
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'performance-2',
          type: 'group',
          weight: 1,
        },
      ],
    });
  });

  it('should throw error for unknown group slug', () => {
    expect(() =>
      // @ts-expect-error A safeguard test case; the error should never be thrown
      createAggregatedCategory('unknown-group', {
        urlCount: 1,
        weights: { 1: 1 },
      }),
    ).toThrow(
      'Invalid Lighthouse group slug: "unknown-group". Available groups: performance, accessibility, best-practices, seo',
    );
  });

  it('should handle single URL', () => {
    const result = createAggregatedCategory('accessibility', {
      urlCount: 1,
      weights: { 1: 1 },
    });

    expect(result.refs).toHaveLength(1);
    expect(result.refs[0]?.slug).toBe('accessibility');
  });

  it('should handle multiple URLs', () => {
    const result = createAggregatedCategory('seo', {
      urlCount: 3,
      weights: { 1: 1, 2: 1, 3: 1 },
    });

    expect(result.refs).toHaveLength(3);
    expect(result.refs.map(ref => ref.slug)).toEqual([
      'seo-1',
      'seo-2',
      'seo-3',
    ]);
  });
});

describe('expandAggregatedCategory', () => {
  it('should expand Lighthouse plugin refs only', () => {
    expect(
      expandAggregatedCategory(
        {
          slug: 'mixed-category',
          title: 'Mixed Category',
          refs: [
            {
              type: 'group',
              plugin: LIGHTHOUSE_PLUGIN_SLUG,
              slug: 'performance',
              weight: 2,
            },
            { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
          ],
        },
        {
          urlCount: 2,
          weights: { 1: 2, 2: 2 },
        },
      ).refs,
    ).toEqual([
      {
        type: 'group',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'performance-1',
        weight: 2,
      },
      {
        type: 'group',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'performance-2',
        weight: 2,
      },
      { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
    ]);
  });

  it('should expand both group and audit refs', () => {
    expect(
      expandAggregatedCategory(
        {
          slug: 'mixed-refs',
          title: 'Mixed Refs',
          refs: [
            {
              type: 'group',
              plugin: LIGHTHOUSE_PLUGIN_SLUG,
              slug: 'performance',
              weight: 1,
            },
            {
              type: 'audit',
              plugin: LIGHTHOUSE_PLUGIN_SLUG,
              slug: 'first-contentful-paint',
              weight: 3,
            },
          ],
        },
        {
          urlCount: 2,
          weights: { 1: 3, 2: 1 },
        },
      ).refs,
    ).toEqual([
      {
        type: 'group',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'performance-1',
        weight: 3,
      },
      {
        type: 'group',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'performance-2',
        weight: 1,
      },
      {
        type: 'audit',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'first-contentful-paint-1',
        weight: 3,
      },
      {
        type: 'audit',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'first-contentful-paint-2',
        weight: 1,
      },
    ]);
  });

  it('should preserve category properties', () => {
    const category: CategoryConfig = {
      slug: 'performance',
      title: 'Performance',
      description: 'Website performance metrics',
      docsUrl: 'https://docs.example.com',
      isBinary: true,
      refs: [
        {
          type: 'group',
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'performance',
          weight: 1,
        },
      ],
    };
    expect(
      expandAggregatedCategory(category, { urlCount: 1, weights: { 1: 1 } }),
    ).toEqual(category);
  });

  it('should handle empty refs array', () => {
    const category: CategoryConfig = {
      slug: 'empty-category',
      title: 'Empty Category',
      refs: [],
    };

    expect(
      expandAggregatedCategory(category, {
        urlCount: 2,
        weights: { 1: 1, 2: 1 },
      }),
    ).toEqual(category);
  });

  it('should handle categories with only non-Lighthouse refs', () => {
    const category: CategoryConfig = {
      slug: 'eslint-category',
      title: 'ESLint Category',
      refs: [
        { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
        { type: 'audit', plugin: 'typescript', slug: 'type-check', weight: 1 },
      ],
    };

    expect(
      expandAggregatedCategory(category, {
        urlCount: 3,
        weights: { 1: 1, 2: 1, 3: 1 },
      }),
    ).toEqual(category);
  });

  it('should prioritize URL weights over user-defined category weights', () => {
    expect(
      expandAggregatedCategory(
        {
          slug: 'performance',
          title: 'Performance',
          refs: [
            {
              type: 'group',
              plugin: LIGHTHOUSE_PLUGIN_SLUG,
              slug: 'performance',
              weight: 2,
            },
          ],
        },
        { urlCount: 2, weights: { 1: 3, 2: 5 } },
      ).refs,
    ).toEqual([
      {
        type: 'group',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'performance-1',
        weight: 3,
      },
      {
        type: 'group',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'performance-2',
        weight: 5,
      },
    ]);
  });

  it('should fall back to user-defined weight when URL weight is missing', () => {
    expect(
      expandAggregatedCategory(
        {
          slug: 'performance',
          title: 'Performance',
          refs: [
            {
              type: 'group',
              plugin: LIGHTHOUSE_PLUGIN_SLUG,
              slug: 'performance',
              weight: 7,
            },
          ],
        },
        { urlCount: 2, weights: { 1: 3 } },
      ).refs,
    ).toEqual([
      {
        type: 'group',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'performance-1',
        weight: 3,
      },
      {
        type: 'group',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'performance-2',
        weight: 7,
      },
    ]);
  });

  it('should not add suffixes for single URL but preserve weights', () => {
    expect(
      expandAggregatedCategory(
        {
          slug: 'performance',
          title: 'Performance',
          refs: [
            {
              type: 'group',
              plugin: LIGHTHOUSE_PLUGIN_SLUG,
              slug: 'performance',
              weight: 1,
            },
          ],
        },
        { urlCount: 1, weights: { 1: 5 } },
      ).refs,
    ).toEqual([
      {
        type: 'group',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'performance',
        weight: 5,
      },
    ]);
  });
});

describe('validateContext', () => {
  it('should throw error for invalid context (undefined)', () => {
    expect(() => validateContext(undefined)).toThrow(
      new ContextValidationError('must be an object'),
    );
  });

  it('should throw error for invalid context (missing urlCount)', () => {
    expect(() => validateContext({ weights: {} })).toThrow(
      new ContextValidationError('urlCount must be a non-negative number'),
    );
  });

  it('should throw error for invalid context (negative urlCount)', () => {
    expect(() => validateContext({ urlCount: -1, weights: {} })).toThrow(
      new ContextValidationError('urlCount must be a non-negative number'),
    );
  });

  it('should throw error for invalid context (missing weights)', () => {
    expect(() => validateContext({ urlCount: 2 })).toThrow(
      new ContextValidationError('weights must be an object'),
    );
  });

  it('should accept valid context', () => {
    expect(() =>
      validateContext({ urlCount: 2, weights: { 1: 1, 2: 1 } }),
    ).not.toThrow();
  });
});
