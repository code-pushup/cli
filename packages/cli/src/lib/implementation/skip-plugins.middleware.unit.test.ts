import { describe, expect, vi } from 'vitest';
import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { skipPluginsMiddleware } from './skip-plugins.middleware';

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

describe('skipPluginsMiddleware', () => {
  it('should fill undefined categories with empty array', () => {
    expect(
      skipPluginsMiddleware({
        plugins: [{ slug: 'p1' } as PluginConfig],
      }),
    ).toStrictEqual({
      plugins: [{ slug: 'p1' }],
      categories: [],
    });
  });

  it('should forward equal values if not set', () => {
    expect(
      skipPluginsMiddleware({
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

  it('should filter plugins for slug "p1"', () => {
    const { plugins } = skipPluginsMiddleware({
      skipPlugins: ['p1'],
      plugins: [{ slug: 'p1' }, { slug: 'p2' }] as PluginConfig[],
      categories: [],
    });
    expect(plugins).toStrictEqual([expect.objectContaining({ slug: 'p2' })]);
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
    const { categories, plugins } = skipPluginsMiddleware({
      skipPlugins: ['wrong-slug'],
      plugins: originalPlugins,
      categories: originalCategories,
    });
    expect(categories).toBe(originalCategories);
    expect(plugins).toBe(originalPlugins);
  });

  it('should filter categories for slug "p1"', () => {
    const { categories } = skipPluginsMiddleware({
      skipPlugins: ['p1'],
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
        refs: [{ plugin: 'p2', slug: 'a2-p1' }],
      }),
      expect.objectContaining({
        slug: 'c2',
        refs: [{ plugin: 'p2', slug: 'a1-p2' }],
      }),
    ]);
  });
});
