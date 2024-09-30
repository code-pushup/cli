import { describe, expect, vi } from 'vitest';
import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { ui } from '@code-pushup/utils';
import { filterPluginsMiddleware } from './filter-plugins.middleware';
import { OptionValidationError } from './validate-plugin-filter-options.utils';

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

describe('filterPluginsMiddleware', () => {
  it('should fill undefined categories with empty array', () => {
    expect(
      filterPluginsMiddleware({
        plugins: [{ slug: 'p1' } as PluginConfig],
      }),
    ).toStrictEqual({
      plugins: [{ slug: 'p1' }],
      categories: [],
    });
  });

  it('should forward equal values when neither skipPlugins nor onlyPlugins is set', () => {
    expect(
      filterPluginsMiddleware({
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

  it('should return original values when neither skipPlugins nor onlyPlugins is provided', () => {
    const originalPlugins = [{ slug: 'p1' }, { slug: 'p2' }] as PluginConfig[];
    const originalCategories = [
      {
        slug: 'c1',
        refs: [{ plugin: 'p1', slug: 'a1-p1' }],
      },
    ] as CategoryConfig[];

    const { plugins, categories } = filterPluginsMiddleware({
      plugins: originalPlugins,
      categories: originalCategories,
    });

    expect(plugins).toStrictEqual(originalPlugins);
    expect(categories).toStrictEqual(originalCategories);
  });

  it('should return original values when skipPlugins and onlyPlugins are empty', () => {
    const originalPlugins = [{ slug: 'p1' }, { slug: 'p2' }] as PluginConfig[];
    const originalCategories = [
      {
        slug: 'c1',
        refs: [{ plugin: 'p1', slug: 'a1-p1' }],
      },
    ] as CategoryConfig[];

    const { plugins, categories } = filterPluginsMiddleware({
      plugins: originalPlugins,
      categories: originalCategories,
      skipPlugins: [],
      onlyPlugins: [],
    });

    expect(plugins).toStrictEqual(originalPlugins);
    expect(categories).toStrictEqual(originalCategories);
  });

  it('should filter plugins for slug "p1" in onlyPlugins', () => {
    const { plugins } = filterPluginsMiddleware({
      onlyPlugins: ['p1'],
      plugins: [{ slug: 'p1' }, { slug: 'p2' }] as PluginConfig[],
      categories: [],
    });
    expect(plugins).toStrictEqual([expect.objectContaining({ slug: 'p1' })]);
  });

  it('should filter plugins for slug "p2" in skipPlugins', () => {
    const { plugins, categories } = filterPluginsMiddleware({
      skipPlugins: ['p2'],
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

    expect(plugins).toStrictEqual([expect.objectContaining({ slug: 'p1' })]);
    expect(categories).toStrictEqual([
      expect.objectContaining({
        slug: 'c1',
        refs: [{ plugin: 'p1', slug: 'a1-p1' }],
      }),
    ]);
  });

  it('should filter categories for slug "p1" in onlyPlugins', () => {
    const { categories } = filterPluginsMiddleware({
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

  it('should filter plugins when both skipPlugins and onlyPlugins are provided', () => {
    const { plugins } = filterPluginsMiddleware({
      onlyPlugins: ['p1'],
      skipPlugins: ['p2'],
      plugins: [{ slug: 'p1' }, { slug: 'p2' }] as PluginConfig[],
      categories: [],
    });
    expect(plugins).toStrictEqual([expect.objectContaining({ slug: 'p1' })]);
  });

  it('should trigger verbose logging when skipPlugins or onlyPlugins removes categories', () => {
    const loggerSpy = vi.spyOn(ui().logger, 'info');

    filterPluginsMiddleware({
      onlyPlugins: ['p1'],
      skipPlugins: ['p2'],
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
      verbose: true,
    });

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('removed the following categories'),
    );
  });

  it('should throw OptionValidationError for a slug not present in plugins', () => {
    expect(() =>
      filterPluginsMiddleware({
        onlyPlugins: ['wrong-slug'],
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
      }),
    ).toThrow(
      new OptionValidationError(
        'The --onlyPlugins argument references a plugin that does not exist: wrong-slug. Valid plugins are p1, p2.',
      ),
    );
  });

  it('should throw OptionValidationError when arguments filter each other out', () => {
    expect(() => {
      filterPluginsMiddleware({
        plugins: [
          { slug: 'plugin1', audits: [{ slug: 'a1-p1' }] },
          { slug: 'plugin2', audits: [{ slug: 'a1-p2' }] },
        ] as PluginConfig[],
        categories: [],
        skipPlugins: ['plugin1'],
        onlyPlugins: ['plugin1'],
      });
    }).toThrow(
      new OptionValidationError(
        'The following plugin is specified in both --onlyPlugins and --skipPlugins: plugin1. Please choose one option.',
      ),
    );
  });
});
