import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { logger } from '@code-pushup/utils';
import {
  filterMiddleware,
  filterSkippedCategories,
  filterSkippedInPlugins,
} from './filter.middleware.js';
import { OptionValidationError } from './validate-filter-options.utils.js';

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

describe('filterMiddleware', () => {
  it('should fill undefined categories with empty array', () => {
    expect(
      filterMiddleware({
        plugins: [{ slug: 'p1', audits: [{ slug: 'a1-p1' }] } as PluginConfig],
      }),
    ).toStrictEqual({
      plugins: [{ slug: 'p1', audits: [{ slug: 'a1-p1' }] }],
    });
  });

  it('should forward original values when no filter options are provided', () => {
    const originalPlugins = [
      { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
      { slug: 'p2', audits: [{ slug: 'a1-p2' }] },
    ] as PluginConfig[];
    const originalCategories = [
      {
        slug: 'c1',
        refs: [
          { type: 'audit', plugin: 'p1', slug: 'a1-p1' },
          { type: 'audit', plugin: 'p2', slug: 'a1-p2' },
        ],
      },
    ] as CategoryConfig[];

    const { plugins, categories } = filterMiddleware({
      plugins: originalPlugins,
      categories: originalCategories,
    });

    expect(plugins).toStrictEqual(originalPlugins);
    expect(categories).toStrictEqual(originalCategories);
  });

  it('should forward original values when filter options are empty', () => {
    const originalPlugins = [
      { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
      { slug: 'p2', audits: [{ slug: 'a1-p2' }] },
    ] as PluginConfig[];
    const originalCategories = [
      {
        slug: 'c1',
        refs: [
          { type: 'audit', plugin: 'p1', slug: 'a1-p1' },
          { type: 'audit', plugin: 'p2', slug: 'a1-p2' },
        ],
      },
    ] as CategoryConfig[];

    const { plugins, categories } = filterMiddleware({
      plugins: originalPlugins,
      categories: originalCategories,
      skipPlugins: [],
      onlyPlugins: [],
      skipCategories: [],
      onlyCategories: [],
    });

    expect(plugins).toStrictEqual(originalPlugins);
    expect(categories).toStrictEqual(originalCategories);
  });

  it.each([
    [{ onlyPlugins: ['p1'] }, { slug: 'p1' }],
    [{ skipPlugins: ['p1'] }, { slug: 'p2' }],
    [{ skipPlugins: ['p1'], onlyPlugins: ['p2'] }, { slug: 'p2' }],
    [{ skipPlugins: ['p3'], onlyPlugins: ['p2'] }, { slug: 'p2' }],
  ])(
    'should filter plugins with plugin filter option %o',
    (option, expected) => {
      const { plugins } = filterMiddleware({
        ...option,
        plugins: [
          {
            slug: 'p1',
            groups: [{ slug: 'g1-p1', refs: [{ slug: 'a1-p1', weight: 1 }] }],
            audits: [{ slug: 'a1-p1' }],
          },
          {
            slug: 'p2',
            groups: [{ slug: 'g1-p2', refs: [{ slug: 'a1-p2', weight: 1 }] }],
            audits: [{ slug: 'a1-p2' }],
          },
        ] as PluginConfig[],
      });
      expect(plugins).toStrictEqual([expect.objectContaining(expected)]);
    },
  );

  it.each([
    [{ onlyPlugins: ['p1'] }, ['p1'], ['c1']],
    [{ skipPlugins: ['p1'], onlyPlugins: ['p3'] }, ['p3'], ['c2']],
    [{ skipPlugins: ['p1'] }, ['p2', 'p3'], ['c1', 'c2']],
  ])(
    'should filter plugins and categories with plugin filter option %o',
    (option, expectedPlugins, expectedCategories) => {
      const { plugins, categories } = filterMiddleware({
        ...option,
        plugins: [
          {
            slug: 'p1',
            audits: [{ slug: 'a1-p1' }],
            groups: [{ slug: 'g1-p1', refs: [{ slug: 'a1-p1', weight: 1 }] }],
          },
          {
            slug: 'p2',
            audits: [{ slug: 'a1-p2' }],
            groups: [{ slug: 'g1-p2', refs: [{ slug: 'a1-p2', weight: 1 }] }],
          },
          {
            slug: 'p3',
            audits: [{ slug: 'a1-p3' }],
            groups: [{ slug: 'g1-p3', refs: [{ slug: 'a1-p3', weight: 1 }] }],
          },
        ] as PluginConfig[],
        categories: [
          {
            slug: 'c1',
            refs: [
              { type: 'group', plugin: 'p1', slug: 'g1-p1', weight: 1 },
              { type: 'group', plugin: 'p2', slug: 'g1-p2', weight: 1 },
            ],
          },
          {
            slug: 'c2',
            refs: [{ type: 'group', plugin: 'p3', slug: 'g1-p3', weight: 1 }],
          },
        ] as CategoryConfig[],
      });
      const pluginSlugs = plugins.map(({ slug }) => slug);
      const categorySlugs = categories.map(({ slug }) => slug);

      expect(pluginSlugs).toStrictEqual(expectedPlugins);
      expect(categorySlugs).toStrictEqual(expectedCategories);
    },
  );

  it.each([
    [{ skipCategories: ['c1'] }, ['p3'], ['c2']],
    [{ skipCategories: ['c1'], onlyCategories: ['c2'] }, ['p3'], ['c2']],
    [{ onlyCategories: ['c1'] }, ['p1', 'p2'], ['c1']],
  ])(
    'should filter plugins and categories with category filter option %o',
    (option, expectedPlugins, expectedCategories) => {
      const { plugins, categories } = filterMiddleware({
        ...option,
        plugins: [
          {
            slug: 'p1',
            audits: [{ slug: 'a1-p1' }],
            groups: [{ slug: 'g1-p1', refs: [{ slug: 'a1-p1', weight: 1 }] }],
          },
          {
            slug: 'p2',
            audits: [{ slug: 'a1-p2' }],
            groups: [{ slug: 'g1-p2', refs: [{ slug: 'a1-p2', weight: 1 }] }],
          },
          {
            slug: 'p3',
            audits: [{ slug: 'a1-p3' }],
            groups: [{ slug: 'g1-p3', refs: [{ slug: 'a1-p3', weight: 1 }] }],
          },
        ] as PluginConfig[],
        categories: [
          {
            slug: 'c1',
            refs: [
              { type: 'group', plugin: 'p1', slug: 'g1-p1', weight: 1 },
              { type: 'group', plugin: 'p2', slug: 'g1-p2', weight: 1 },
            ],
          },
          {
            slug: 'c2',
            refs: [{ type: 'group', plugin: 'p3', slug: 'g1-p3', weight: 1 }],
          },
        ] as CategoryConfig[],
      });
      const pluginSlugs = plugins.map(({ slug }) => slug);
      const categorySlugs = categories.map(({ slug }) => slug);

      expect(pluginSlugs).toStrictEqual(expectedPlugins);
      expect(categorySlugs).toStrictEqual(expectedCategories);
    },
  );

  it.each([
    [
      { skipPlugins: ['eslint'], onlyCategories: ['performance'] },
      ['lighthouse'],
      ['performance'],
    ],
    [
      { skipCategories: ['performance'], onlyPlugins: ['lighthouse'] },
      ['lighthouse'],
      ['best-practices'],
    ],
  ])(
    'should filter plugins and categories with mixed filter options: %o',
    (option, expectedPlugins, expectedCategories) => {
      const { plugins, categories } = filterMiddleware({
        ...option,
        plugins: [
          {
            slug: 'lighthouse',
            audits: [{ slug: 'largest-contentful-paint' }, { slug: 'doctype' }],
            groups: [
              {
                slug: 'performance',
                refs: [{ slug: 'largest-contentful-paint', weight: 1 }],
              },
              {
                slug: 'best-practices',
                refs: [{ slug: 'doctype', weight: 1 }],
              },
            ],
          },
          {
            slug: 'eslint',
            audits: [{ slug: 'no-unreachable' }],
            groups: [
              {
                slug: 'problems',
                refs: [{ slug: 'no-unreachable', weight: 1 }],
              },
            ],
          },
        ] as PluginConfig[],
        categories: [
          {
            slug: 'performance',
            refs: [
              {
                type: 'group',
                plugin: 'lighthouse',
                slug: 'performance',
                weight: 1,
              },
            ],
          },
          {
            slug: 'best-practices',
            refs: [
              {
                type: 'group',
                plugin: 'lighthouse',
                slug: 'best-practices',
                weight: 1,
              },
            ],
          },
          {
            slug: 'bug-prevention',
            refs: [
              {
                type: 'group',
                plugin: 'eslint',
                slug: 'problems',
                weight: 1,
              },
            ],
          },
        ] as CategoryConfig[],
      });
      const pluginSlugs = plugins.map(({ slug }) => slug);
      const categorySlugs = categories?.map(({ slug }) => slug);

      expect(pluginSlugs).toStrictEqual(expectedPlugins);
      expect(categorySlugs).toStrictEqual(expectedCategories);
    },
  );

  it('should trigger verbose logging when skipPlugins or onlyPlugins removes categories', () => {
    logger.setVerbose(true);

    filterMiddleware({
      onlyPlugins: ['p1'],
      skipPlugins: ['p2'],
      plugins: [
        { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
        { slug: 'p2', audits: [{ slug: 'a1-p2' }] },
      ] as PluginConfig[],
      categories: [
        {
          slug: 'c1',
          refs: [
            { type: 'audit', plugin: 'p1', slug: 'a1-p1', weight: 1 },
            { type: 'audit', plugin: 'p2', slug: 'a1-p2', weight: 1 },
          ],
        },
        {
          slug: 'c2',
          refs: [{ type: 'audit', plugin: 'p2', slug: 'a1-p2', weight: 1 }],
        },
      ] as CategoryConfig[],
    });

    expect(logger.info).toHaveBeenNthCalledWith(
      1,
      'The --skipPlugins argument removed the following categories: c1, c2.',
    );
    expect(logger.info).toHaveBeenNthCalledWith(
      2,
      'The --onlyPlugins argument removed the following categories: c1, c2.',
    );
  });

  it('should throw OptionValidationError for a slug not present in plugins', () => {
    expect(() =>
      filterMiddleware({
        onlyPlugins: ['wrong-slug'],
        plugins: [
          { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
          { slug: 'p2', audits: [{ slug: 'a1-p2' }] },
        ] as PluginConfig[],
        categories: [
          {
            slug: 'c1',
            refs: [
              { type: 'audit', plugin: 'p1', slug: 'a1-p1', weight: 1 },
              { type: 'audit', plugin: 'p2', slug: 'a1-p2', weight: 1 },
            ],
          },
          {
            slug: 'c2',
            refs: [{ type: 'audit', plugin: 'p2', slug: 'a1-p2', weight: 1 }],
          },
        ] as CategoryConfig[],
      }),
    ).toThrow(
      new OptionValidationError(
        'The --onlyPlugins argument references a plugin that does not exist: wrong-slug. Valid plugins are p1, p2.',
      ),
    );
  });

  it('should throw OptionValidationError when plugin filter arguments filter each other out', () => {
    expect(() => {
      filterMiddleware({
        plugins: [
          { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
          { slug: 'p2', audits: [{ slug: 'a1-p2' }] },
        ] as PluginConfig[],
        categories: [
          {
            slug: 'c1',
            refs: [
              { type: 'audit', plugin: 'p1', slug: 'a1-p1', weight: 1 },
              { type: 'audit', plugin: 'p2', slug: 'a1-p2', weight: 1 },
            ],
          },
        ] as CategoryConfig[],
        skipPlugins: ['p1'],
        onlyPlugins: ['p1'],
      });
    }).toThrow(
      new OptionValidationError(
        'The following plugin is specified in both --onlyPlugins and --skipPlugins: p1. Please choose one option.',
      ),
    );
  });

  it('should throw OptionValidationError when mixed arguments filter each other out', () => {
    expect(() => {
      filterMiddleware({
        plugins: [
          {
            slug: 'p1',
            audits: [{ slug: 'a1-p1', isSkipped: false }],
          },
          {
            slug: 'p2',
            groups: [{ slug: 'g1-p2', isSkipped: true }],
          },
        ] as PluginConfig[],
        categories: [
          {
            slug: 'c1',
            refs: [{ type: 'audit', plugin: 'p1', slug: 'a1-p1', weight: 1 }],
          },
          {
            slug: 'c2',
            refs: [{ type: 'group', plugin: 'p1', slug: 'g1-p2', weight: 1 }],
          },
        ] as CategoryConfig[],
        skipPlugins: ['p1'],
        onlyCategories: ['c1'],
      });
    }).toThrow(
      new OptionValidationError(
        `Nothing to report. No plugins or categories are available after filtering. Available plugins: p1, p2. Available categories: c1, c2.`,
      ),
    );
  });

  it('should allow onlyPlugins to include plugins not referenced by categories', () => {
    const { plugins } = filterMiddleware({
      plugins: [
        {
          slug: 'p1',
          audits: [{ slug: 'a1-p1', isSkipped: false }],
          groups: [
            {
              slug: 'g1-p1',
              refs: [{ slug: 'a1-p1', weight: 1 }],
              isSkipped: false,
            },
          ],
        },
        {
          slug: 'p2',
          audits: [{ slug: 'a1-p2', isSkipped: false }],
          groups: [
            {
              slug: 'g1-p2',
              refs: [{ slug: 'a1-p2', weight: 1 }],
              isSkipped: false,
            },
          ],
        },
      ] as PluginConfig[],
      categories: [
        {
          slug: 'c1',
          refs: [{ type: 'group', plugin: 'p1', slug: 'g1-p1', weight: 1 }],
        },
      ] as CategoryConfig[],
      onlyPlugins: ['p2'],
    });

    expect(plugins.map(plugin => plugin.slug)).toStrictEqual(['p2']);
  });
});

describe('filterSkippedInPlugins', () => {
  it('should filter out skipped audits and groups', () => {
    expect(
      filterSkippedInPlugins([
        {
          slug: 'p1',
          audits: [
            { slug: 'a1', isSkipped: false },
            { slug: 'a2', isSkipped: true },
          ],
          groups: [
            {
              slug: 'g1',
              refs: [
                { slug: 'a1', weight: 1 },
                { slug: 'a2', weight: 1 },
              ],
              isSkipped: false,
            },
          ],
        },
      ] as PluginConfig[]),
    ).toEqual([
      {
        slug: 'p1',
        audits: [{ slug: 'a1' }],
        groups: [
          {
            slug: 'g1',
            refs: [{ slug: 'a1', weight: 1 }],
          },
        ],
      },
    ]);
  });

  it('should filter out entire groups when marked as skipped', () => {
    expect(
      filterSkippedInPlugins([
        {
          slug: 'p1',
          audits: [{ slug: 'a1', isSkipped: false }],
          groups: [
            {
              slug: 'g1',
              refs: [{ slug: 'a1', weight: 1 }],
              isSkipped: true,
            },
          ],
        },
      ] as PluginConfig[]),
    ).toEqual([
      {
        slug: 'p1',
        audits: [{ slug: 'a1' }],
        groups: [],
      },
    ]);
  });
});

describe('filterSkippedCategories', () => {
  it('should filter out categories with all skipped refs', () => {
    expect(
      filterSkippedCategories(
        [
          {
            slug: 'c1',
            refs: [{ type: 'group', plugin: 'p1', slug: 'g1', weight: 1 }],
          },
        ] as CategoryConfig[],
        [
          {
            slug: 'p1',
            audits: [{ slug: 'a1' }, { slug: 'a2' }],
          },
        ] as PluginConfig[],
      ),
    ).toStrictEqual([]);
  });

  it('should retain categories with valid refs', () => {
    expect(
      filterSkippedCategories(
        [
          {
            slug: 'c1',
            refs: [{ type: 'group', plugin: 'p1', slug: 'g1-p1', weight: 1 }],
          },
          {
            slug: 'c2',
            refs: [{ type: 'group', plugin: 'p2', slug: 'g1-p2', weight: 1 }],
          },
        ] as CategoryConfig[],
        [
          {
            slug: 'p1',
            audits: [{ slug: 'a1-p1' }, { slug: 'a2-p1' }],
            groups: [],
          },
          {
            slug: 'p2',
            audits: [{ slug: 'a1-p2' }, { slug: 'a2-p2' }],
            groups: [
              {
                slug: 'g1-p2',
                refs: [
                  { slug: 'a1-p2', weight: 1 },
                  { slug: 'a2-p2', weight: 1 },
                ],
              },
            ],
          },
        ] as PluginConfig[],
      ),
    ).toEqual([
      {
        slug: 'c2',
        refs: [{ type: 'group', plugin: 'p2', slug: 'g1-p2', weight: 1 }],
      },
    ]);
  });
});
