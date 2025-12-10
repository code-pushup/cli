import { describe, expect, it } from 'vitest';
import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { axeCategories, extractGroupSlugs } from './categories.js';
import { AXE_PLUGIN_SLUG } from './constants.js';
import { axeGroupRef } from './utils.js';

describe('axeCategories', () => {
  const createMockPlugin = (
    overrides: Partial<Pick<PluginConfig, 'groups' | 'context'>> = {},
  ): Pick<PluginConfig, 'groups' | 'context'> => ({
    groups: [
      { slug: 'aria', title: 'ARIA', refs: [] },
      { slug: 'color', title: 'Color & Contrast', refs: [] },
    ],
    context: { urlCount: 1, weights: { 1: 1 } },
    ...overrides,
  });

  it('should create accessibility category with all groups', () => {
    expect(axeCategories(createMockPlugin())).toEqual([
      {
        slug: 'axe-a11y',
        title: 'Axe Accessibility',
        refs: [
          { plugin: AXE_PLUGIN_SLUG, slug: 'aria', type: 'group', weight: 1 },
          {
            plugin: AXE_PLUGIN_SLUG,
            slug: 'color',
            type: 'group',
            weight: 1,
          },
        ],
      },
    ]);
  });

  it('should expand refs for multi-URL', () => {
    const plugin = createMockPlugin({
      groups: [
        { slug: 'aria-1', title: 'ARIA 1', refs: [] },
        { slug: 'aria-2', title: 'ARIA 2', refs: [] },
      ],
      context: { urlCount: 2, weights: { 1: 1, 2: 1 } },
    });

    expect(axeCategories(plugin)).toEqual([
      {
        slug: 'axe-a11y',
        title: 'Axe Accessibility',
        refs: [
          {
            plugin: AXE_PLUGIN_SLUG,
            slug: 'aria-1',
            type: 'group',
            weight: 1,
          },
          {
            plugin: AXE_PLUGIN_SLUG,
            slug: 'aria-2',
            type: 'group',
            weight: 1,
          },
        ],
      },
    ]);
  });

  it('should return empty array if plugin has no groups', () => {
    expect(axeCategories(createMockPlugin({ groups: [] }))).toEqual([]);
  });

  it('should return categories unchanged for single URL', () => {
    const categories: CategoryConfig[] = [
      {
        slug: 'axe-a11y',
        title: 'Axe Accessibility',
        refs: [axeGroupRef('aria')],
      },
    ];

    expect(axeCategories(createMockPlugin(), categories)).toEqual(categories);
  });

  it('should expand Axe refs and preserve non-Axe refs for multi-URL', () => {
    const categories: CategoryConfig[] = [
      {
        slug: 'axe-a11y',
        title: 'Axe Accessibility',
        refs: [
          axeGroupRef('aria'),
          { plugin: 'lighthouse', type: 'group', slug: 'seo', weight: 1 },
        ],
      },
    ];

    expect(
      axeCategories(
        createMockPlugin({ context: { urlCount: 2, weights: { 1: 1, 2: 1 } } }),
        categories,
      ),
    ).toEqual([
      {
        slug: 'axe-a11y',
        title: 'Axe Accessibility',
        refs: [
          { plugin: AXE_PLUGIN_SLUG, slug: 'aria-1', type: 'group', weight: 1 },
          { plugin: AXE_PLUGIN_SLUG, slug: 'aria-2', type: 'group', weight: 1 },
          { plugin: 'lighthouse', type: 'group', slug: 'seo', weight: 1 },
        ],
      },
    ]);
  });

  it('should throw for invalid context', () => {
    const plugin = createMockPlugin({
      context: { urlCount: 2, weights: { 1: 1 } },
    });

    expect(() => axeCategories(plugin)).toThrow(
      'Invalid plugin context: weights count must match urlCount',
    );
  });
});

describe('extractGroupSlugs', () => {
  it('should extract unique base slugs from groups', () => {
    expect(
      extractGroupSlugs([
        { slug: 'aria-1', title: 'ARIA 1', refs: [] },
        { slug: 'aria-2', title: 'ARIA 2', refs: [] },
        { slug: 'color', title: 'Color & Contrast', refs: [] },
      ]),
    ).toEqual(['aria', 'color']);
  });

  it('should filter out invalid group slugs', () => {
    expect(
      extractGroupSlugs([
        { slug: 'aria', title: 'ARIA', refs: [] },
        { slug: 'invalid-group', title: 'Invalid', refs: [] },
      ]),
    ).toEqual(['aria']);
  });
});
