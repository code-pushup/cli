import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { ui } from '@code-pushup/utils';
import { filterMiddleware } from './filter.middleware';
import { OptionValidationError } from './validate-filter-options.utils';

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
      categories: [],
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
          { plugin: 'p1', slug: 'a1-p1' },
          { plugin: 'p2', slug: 'a1-p2' },
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
          { plugin: 'p1', slug: 'a1-p1' },
          { plugin: 'p2', slug: 'a1-p2' },
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
        plugins: [{ slug: 'p1' }, { slug: 'p2' }] as PluginConfig[],
        categories: [],
      });
      expect(plugins).toStrictEqual([expect.objectContaining(expected)]);
    },
  );

  it.each([
    [
      { onlyPlugins: ['p1'] },
      [{ slug: 'p1' }],
      [{ slug: 'c1', refs: [{ plugin: 'p1', slug: 'a1-p1' }] }],
    ],
    [
      { skipPlugins: ['p1'], onlyPlugins: ['p3'] },
      [{ slug: 'p3' }],
      [{ slug: 'c2', refs: [{ plugin: 'p3', slug: 'a1-p3' }] }],
    ],
    [
      { skipPlugins: ['p1'] },
      [{ slug: 'p2' }, { slug: 'p3' }],
      [
        { slug: 'c1', refs: [{ plugin: 'p2', slug: 'a1-p2' }] },
        { slug: 'c2', refs: [{ plugin: 'p3', slug: 'a1-p3' }] },
      ],
    ],
  ])(
    'should filter plugins and categories with plugin filter option %o',
    (option, expectedPlugins, expectedCategories) => {
      const { plugins, categories } = filterMiddleware({
        ...option,
        plugins: [
          { slug: 'p1' },
          { slug: 'p2' },
          { slug: 'p3' },
        ] as PluginConfig[],
        categories: [
          {
            slug: 'c1',
            refs: [
              { plugin: 'p1', slug: 'a1-p1' },
              { plugin: 'p2', slug: 'a1-p2' },
            ],
          },
          { slug: 'c2', refs: [{ plugin: 'p3', slug: 'a1-p3' }] },
        ] as CategoryConfig[],
      });
      expect(plugins).toStrictEqual(expectedPlugins);
      expect(categories).toStrictEqual(expectedCategories);
    },
  );

  it.each([
    [
      { skipCategories: ['c1'] },
      [{ slug: 'p3' }],
      [{ slug: 'c2', refs: [{ plugin: 'p3', slug: 'a1-p3' }] }],
    ],
    [
      { skipCategories: ['c1'], onlyCategories: ['c2'] },
      [{ slug: 'p3' }],
      [{ slug: 'c2', refs: [{ plugin: 'p3', slug: 'a1-p3' }] }],
    ],
    [
      { onlyCategories: ['c1'] },
      [{ slug: 'p1' }, { slug: 'p2' }],
      [
        {
          slug: 'c1',
          refs: [
            { plugin: 'p1', slug: 'a1-p1' },
            { plugin: 'p2', slug: 'a1-p2' },
          ],
        },
      ],
    ],
  ])(
    'should filter plugins and categories with category filter option %o',
    (option, expectedPlugins, expectedCategories) => {
      const { plugins, categories } = filterMiddleware({
        ...option,
        plugins: [
          { slug: 'p1' },
          { slug: 'p2' },
          { slug: 'p3' },
        ] as PluginConfig[],
        categories: [
          {
            slug: 'c1',
            refs: [
              { plugin: 'p1', slug: 'a1-p1' },
              { plugin: 'p2', slug: 'a1-p2' },
            ],
          },
          { slug: 'c2', refs: [{ plugin: 'p3', slug: 'a1-p3' }] },
        ] as CategoryConfig[],
      });
      expect(plugins).toStrictEqual(expectedPlugins);
      expect(categories).toStrictEqual(expectedCategories);
    },
  );

  it('should filter plugins and categories with mixed filter options', () => {
    const { plugins, categories } = filterMiddleware({
      skipPlugins: ['p1'],
      onlyCategories: ['c1'],
      plugins: [
        { slug: 'p1' },
        { slug: 'p2' },
        { slug: 'p3' },
      ] as PluginConfig[],
      categories: [
        {
          slug: 'c1',
          refs: [
            { plugin: 'p1', slug: 'a1-p1' },
            { plugin: 'p2', slug: 'a1-p2' },
          ],
        },
        { slug: 'c2', refs: [{ plugin: 'p3', slug: 'a1-p3' }] },
      ] as CategoryConfig[],
    });
    expect(plugins).toStrictEqual([{ slug: 'p2' }]);
    expect(categories).toStrictEqual([
      { slug: 'c1', refs: [{ plugin: 'p2', slug: 'a1-p2' }] },
    ]);
  });

  it('should trigger verbose logging when skipPlugins or onlyPlugins removes categories', () => {
    const loggerSpy = vi.spyOn(ui().logger, 'info');

    filterMiddleware({
      onlyPlugins: ['p1'],
      skipPlugins: ['p2'],
      plugins: [{ slug: 'p1' }, { slug: 'p2' }] as PluginConfig[],
      categories: [
        {
          slug: 'c1',
          refs: [
            { plugin: 'p1', slug: 'a1-p1' },
            { plugin: 'p2', slug: 'a1-p2' },
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
              { plugin: 'p1', slug: 'a1-p1' },
              { plugin: 'p2', slug: 'a1-p2' },
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
              { plugin: 'p1', slug: 'a1-p1' },
              { plugin: 'p2', slug: 'a1-p2' },
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
          { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
        ] as PluginConfig[],
        categories: [
          { slug: 'c1', refs: [{ plugin: 'p1', slug: 'a1-p1' }] },
        ] as CategoryConfig[],
        skipPlugins: ['p1'],
        onlyCategories: ['c1'],
      });
    }).toThrow(
      new OptionValidationError(
        `Nothing to report. No plugins or categories are available after filtering. Available plugins: p1. Available categories: c1.`,
      ),
    );
  });
});
