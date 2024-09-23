import { describe, expect, vi } from 'vitest';
import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { onlyPluginsMiddleware } from './only-plugins.middleware';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    readRcByPath: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
    autoloadRc: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('onlyPluginsMiddleware', () => {
  it('should fill undefined categories with empty array', () => {
    expect(
      onlyPluginsMiddleware({
        plugins: [{ slug: 'p1' } as PluginConfig],
      }),
    ).toStrictEqual({
      plugins: [{ slug: 'p1' }],
      categories: [],
    });
  });

  it('should forward equal values if not set', () => {
    expect(
      onlyPluginsMiddleware({
        plugins: [{ slug: 'p1' } as PluginConfig],
        categories: [
          { slug: 'c1', refs: [{ plugin: 'p1' }] } as CategoryConfig,
        ],
      }),
    ).toStrictEqual({
      plugins: [{ slug: 'p1' }],
      categories: [{ slug: 'c1', refs: [{ plugin: 'p1' }] }],
    });
  });

  it('should filter plugins plugins for slug "p1"', () => {
    const { plugins } = onlyPluginsMiddleware({
      onlyPlugins: ['p1'],
      plugins: [{ slug: 'p1' }, { slug: 'p2' }] as PluginConfig[],
      categories: [],
    });
    expect(plugins).toStrictEqual([expect.objectContaining({ slug: 'p1' })]);
  });

  it('should forward plugins and categories for a slug not present in plugins', () => {
    const originalCategories = [
      {
        slug: 'c1',
        refs: [
          { plugin: 'p1', slug: 'a1-p1' },
          { plugin: 'p2', slug: 'a2-p1' },
        ],
      },
      { slug: 'c2', refs: [{ plugin: 'p2', slug: 'a1-p2' }] },
    ] as CategoryConfig[];
    const originalPlugins = [{ slug: 'p1' }, { slug: 'p2' }] as PluginConfig[];
    const { categories, plugins } = onlyPluginsMiddleware({
      onlyPlugins: ['wrong-slug'],
      plugins: originalPlugins,
      categories: originalCategories,
    });
    expect(categories).toBe(originalCategories);
    expect(plugins).toBe(originalPlugins);
  });

  it('should filter categories for slug "p1"', () => {
    const { categories } = onlyPluginsMiddleware({
      onlyPlugins: ['p1'],
      plugins: [{ slug: 'p1' }, { slug: 'p2' }] as PluginConfig[],
      categories: [
        {
          slug: 'c1',
          refs: [
            { plugin: 'p1', slug: 'a1-p1' },
            { plugin: 'p2', slug: 'a2-p1' },
          ],
        },
        { slug: 'c2', refs: [{ plugin: 'p2', slug: 'a1-p2' }] },
      ] as CategoryConfig[],
    });
    expect(categories).toStrictEqual([
      expect.objectContaining({
        slug: 'c1',
        refs: [{ plugin: 'p1', slug: 'a1-p1' }],
      }),
    ]);
  });
});
