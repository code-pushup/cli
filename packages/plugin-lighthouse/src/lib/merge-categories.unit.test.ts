import { describe, expect, it } from 'vitest';
import type { CategoryConfig, Group } from '@code-pushup/models';
import { LIGHTHOUSE_PLUGIN_SLUG } from './constants.js';
import {
  countUrls,
  createAggregatedCategory,
  expandAggregatedCategory,
  extractGroupSlugs,
  mergeLighthouseCategories,
} from './merge-categories.js';

describe('mergeLighthouseCategories', () => {
  const mockSingleUrlPlugin = {
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
  };

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

    it('should return provided categories when no groups', () => {
      expect(
        mergeLighthouseCategories({ groups: undefined }, mockUserCategories),
      ).toEqual(mockUserCategories);
    });
  });

  describe('with single URL', () => {
    it('should return empty array when no categories provided', () => {
      expect(mergeLighthouseCategories(mockSingleUrlPlugin)).toEqual([]);
    });

    it('should return provided categories unchanged', () => {
      expect(
        mergeLighthouseCategories(mockSingleUrlPlugin, mockUserCategories),
      ).toEqual(mockUserCategories);
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
            weight: 2,
          },
          {
            type: 'group',
            plugin: LIGHTHOUSE_PLUGIN_SLUG,
            slug: 'performance-2',
            weight: 2,
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
      const categoryWithMixedRefs: CategoryConfig[] = [
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
      ];

      expect(
        mergeLighthouseCategories(mockMultiUrlPlugin, categoryWithMixedRefs)[0]
          ?.refs,
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
          weight: 2,
        },
        {
          type: 'audit',
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'first-contentful-paint-2',
          weight: 2,
        },
      ]);
    });

    it('should preserve non-Lighthouse refs unchanged', () => {
      const categoryWithOtherRefs: CategoryConfig[] = [
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
      ];

      expect(
        mergeLighthouseCategories(mockMultiUrlPlugin, categoryWithOtherRefs)[0]
          ?.refs,
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
      const categoryWithoutLighthouse: CategoryConfig[] = [
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
        mergeLighthouseCategories(
          mockMultiUrlPlugin,
          categoryWithoutLighthouse,
        )[0],
      ).toEqual(categoryWithoutLighthouse[0]);
    });

    it('should preserve all category properties', () => {
      const categoryWithAllProps: CategoryConfig[] = [
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
      ];

      expect(
        mergeLighthouseCategories(mockMultiUrlPlugin, categoryWithAllProps)[0],
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
      const tripleUrlPlugin = {
        groups: [
          { slug: 'performance-1', title: 'Performance 1', refs: [] },
          { slug: 'performance-2', title: 'Performance 2', refs: [] },
          { slug: 'performance-3', title: 'Performance 3', refs: [] },
        ],
      };

      const userCategories: CategoryConfig[] = [
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

      const result = mergeLighthouseCategories(tripleUrlPlugin, userCategories);

      expect(result[0]?.refs).toHaveLength(3);
      expect(result[0]?.refs.map(({ slug }) => slug)).toEqual([
        'performance-1',
        'performance-2',
        'performance-3',
      ]);
    });

    it('should handle groups with non-sequential numbering', () => {
      const nonSequentialPlugin = {
        groups: [
          { slug: 'performance-1', title: 'Performance 1', refs: [] },
          { slug: 'performance-5', title: 'Performance 5', refs: [] },
          { slug: 'accessibility-1', title: 'Accessibility 1', refs: [] },
          { slug: 'accessibility-5', title: 'Accessibility 5', refs: [] },
        ],
      };

      const result = mergeLighthouseCategories(nonSequentialPlugin);

      expect(result[0]?.refs).toHaveLength(5);
      expect(result[0]?.refs.map(ref => ref.slug)).toEqual([
        'performance-1',
        'performance-2',
        'performance-3',
        'performance-4',
        'performance-5',
      ]);
    });

    it('should filter out invalid lighthouse groups', () => {
      const pluginWithInvalidGroups = {
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
      };

      const result = mergeLighthouseCategories(pluginWithInvalidGroups);

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
        mergeLighthouseCategories({ groups: [] }, mockUserCategories),
      ).toEqual(mockUserCategories);
    });

    it('should handle categories with empty refs', () => {
      const emptyRefsCategory: CategoryConfig[] = [
        {
          slug: 'empty-category',
          title: 'Empty Category',
          refs: [],
        },
      ];

      expect(
        mergeLighthouseCategories(mockMultiUrlPlugin, emptyRefsCategory)[0],
      ).toEqual(emptyRefsCategory[0]);
    });
  });
});

describe('countUrls', () => {
  it('should return 1 for single URL groups', () => {
    const groups: Group[] = [
      { slug: 'performance', title: 'Performance', refs: [] },
      { slug: 'accessibility', title: 'Accessibility', refs: [] },
    ];
    expect(countUrls(groups)).toBe(1);
  });

  it('should count URLs from numbered suffixes', () => {
    const groups: Group[] = [
      { slug: 'performance-1', title: 'Performance 1', refs: [] },
      { slug: 'performance-2', title: 'Performance 2', refs: [] },
      { slug: 'accessibility-1', title: 'Accessibility 1', refs: [] },
      { slug: 'accessibility-2', title: 'Accessibility 2', refs: [] },
    ];
    expect(countUrls(groups)).toBe(2);
  });

  it('should handle non-sequential numbering', () => {
    const groups: Group[] = [
      { slug: 'performance-1', title: 'Performance 1', refs: [] },
      { slug: 'performance-5', title: 'Performance 5', refs: [] },
      { slug: 'accessibility-1', title: 'Accessibility 1', refs: [] },
    ];
    expect(countUrls(groups)).toBe(5);
  });

  it('should handle mixed numbered and non-numbered groups', () => {
    const groups: Group[] = [
      { slug: 'performance', title: 'Performance', refs: [] },
      { slug: 'performance-3', title: 'Performance 3', refs: [] },
      { slug: 'accessibility-1', title: 'Accessibility 1', refs: [] },
    ];
    expect(countUrls(groups)).toBe(3);
  });

  it('should return 1 for empty groups array', () => {
    expect(countUrls([])).toBe(1);
  });

  it('should ignore invalid number suffixes', () => {
    const groups: Group[] = [
      { slug: 'performance-abc', title: 'Performance ABC', refs: [] },
      { slug: 'accessibility-2', title: 'Accessibility 2', refs: [] },
    ];
    expect(countUrls(groups)).toBe(2);
  });
});

describe('extractGroupSlugs', () => {
  it('should extract unique base slugs from numbered groups', () => {
    const groups: Group[] = [
      { slug: 'performance-1', title: 'Performance 1', refs: [] },
      { slug: 'performance-2', title: 'Performance 2', refs: [] },
      { slug: 'accessibility-1', title: 'Accessibility 1', refs: [] },
      { slug: 'accessibility-2', title: 'Accessibility 2', refs: [] },
    ];
    expect(extractGroupSlugs(groups)).toEqual(['performance', 'accessibility']);
  });

  it('should handle non-numbered groups', () => {
    const groups: Group[] = [
      { slug: 'performance', title: 'Performance', refs: [] },
      { slug: 'accessibility', title: 'Accessibility', refs: [] },
    ];
    expect(extractGroupSlugs(groups)).toEqual(['performance', 'accessibility']);
  });

  it('should handle mixed numbered and non-numbered groups', () => {
    const groups: Group[] = [
      { slug: 'performance', title: 'Performance', refs: [] },
      { slug: 'accessibility-1', title: 'Accessibility 1', refs: [] },
      { slug: 'accessibility-2', title: 'Accessibility 2', refs: [] },
    ];
    expect(extractGroupSlugs(groups)).toEqual(['performance', 'accessibility']);
  });

  it('should return unique slugs only', () => {
    const groups: Group[] = [
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
    const result = createAggregatedCategory('performance', 2);
    expect(result).toEqual({
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
    // @ts-expect-error A safeguard test case; the error should never be thrown
    expect(() => createAggregatedCategory('unknown-group', 1)).toThrow(
      'Invalid Lighthouse group slug: "unknown-group". Available groups: performance, accessibility, best-practices, seo',
    );
  });

  it('should handle single URL', () => {
    const result = createAggregatedCategory('accessibility', 1);

    expect(result.refs).toHaveLength(1);
    expect(result.refs[0]?.slug).toBe('accessibility-1');
  });

  it('should handle multiple URLs', () => {
    const result = createAggregatedCategory('seo', 3);

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
    const category: CategoryConfig = {
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
    };

    expect(expandAggregatedCategory(category, 2).refs).toEqual([
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
    const category: CategoryConfig = {
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
    };

    expect(expandAggregatedCategory(category, 2).refs).toEqual([
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
        weight: 3,
      },
      {
        type: 'audit',
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: 'first-contentful-paint-2',
        weight: 3,
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

    expect(expandAggregatedCategory(category, 1)).toEqual({
      slug: 'performance',
      title: 'Performance',
      description: 'Website performance metrics',
      docsUrl: 'https://docs.example.com',
      isBinary: true,
      refs: [
        {
          type: 'group',
          plugin: LIGHTHOUSE_PLUGIN_SLUG,
          slug: 'performance-1',
          weight: 1,
        },
      ],
    });
  });

  it('should handle empty refs array', () => {
    const category: CategoryConfig = {
      slug: 'empty-category',
      title: 'Empty Category',
      refs: [],
    };

    expect(expandAggregatedCategory(category, 2)).toEqual(category);
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

    expect(expandAggregatedCategory(category, 3)).toEqual(category);
  });
});
