import { describe, expect } from 'vitest';
import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { logger } from '@code-pushup/utils';
import type { FilterOptionType, Filterables } from './filter.model.js';
import {
  OptionValidationError,
  createValidationMessage,
  getItemType,
  handleConflictingOptions,
  pluginHasZeroWeightRefs,
  validateFilterOption,
  validateFinalState,
  validateSkippedCategories,
} from './validate-filter-options.utils.js';

describe('validateFilterOption', () => {
  it.each([
    [
      'onlyPlugins',
      ['p1', 'p3', 'p4'],
      'The --onlyPlugins argument references plugins that do not exist: p3, p4. The only valid plugin is p1.',
    ],
    [
      'onlyPlugins',
      ['p1', 'p3'],
      'The --onlyPlugins argument references a plugin that does not exist: p3. The only valid plugin is p1.',
    ],
    [
      'onlyCategories',
      ['c1', 'c3', 'c4'],
      'The --onlyCategories argument references categories that do not exist: c3, c4. The only valid category is c1.',
    ],
    [
      'onlyCategories',
      ['c1', 'c3'],
      'The --onlyCategories argument references a category that does not exist: c3. The only valid category is c1.',
    ],
  ])(
    'should log a warning if the only argument %s references nonexistent slugs %o along with valid ones',
    (option, itemsToFilter, expected) => {
      validateFilterOption(
        option as FilterOptionType,
        {
          plugins: [
            { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
          ] as PluginConfig[],
          categories: [
            { slug: 'c1', refs: [{ plugin: 'p1', slug: 'a1-p1' }] },
          ] as CategoryConfig[],
        },
        { itemsToFilter, skippedItems: [] },
      );
      expect(logger.warn).toHaveBeenCalledWith(expected);
    },
  );

  it.each([
    [
      'skipPlugins',
      ['p3', 'p4'],
      'The --skipPlugins argument references plugins that do not exist: p3, p4. The only valid plugin is p1.',
    ],
    [
      'skipPlugins',
      ['p3'],
      'The --skipPlugins argument references a plugin that does not exist: p3. The only valid plugin is p1.',
    ],
    [
      'skipCategories',
      ['c3', 'c4'],
      'The --skipCategories argument references categories that do not exist: c3, c4. The only valid category is c1.',
    ],
    [
      'skipCategories',
      ['c3'],
      'The --skipCategories argument references a category that does not exist: c3. The only valid category is c1.',
    ],
  ])(
    'should log a warning if the skip argument %s references nonexistent slugs %o',
    (option, itemsToFilter, expected) => {
      validateFilterOption(
        option as FilterOptionType,
        {
          plugins: [
            { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
          ] as PluginConfig[],
          categories: [
            {
              slug: 'c1',
              refs: [{ plugin: 'p1', slug: 'a1-p1' }],
            },
          ] as CategoryConfig[],
        },
        { itemsToFilter, skippedItems: [] },
      );
      expect(logger.warn).toHaveBeenCalledWith(expected);
    },
  );

  it('should not log anything if the onlyPlugins argument references only valid plugins', () => {
    validateFilterOption(
      'onlyPlugins',
      {
        plugins: [
          { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
          { slug: 'p2', audits: [{ slug: 'a1-p2' }] },
        ] as PluginConfig[],
      },
      { itemsToFilter: ['p1'], skippedItems: [] },
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('should log a category ignored as a result of plugin filtering', () => {
    logger.setVerbose(true);

    validateFilterOption(
      'onlyPlugins',
      {
        plugins: [
          { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
          { slug: 'p2', audits: [{ slug: 'a1-p2' }] },
        ] as PluginConfig[],
        categories: [
          { slug: 'c1', refs: [{ plugin: 'p2' }] },
          { slug: 'c2', refs: [{ plugin: 'p1' }] },
          { slug: 'c3', refs: [{ plugin: 'p2' }] },
        ] as CategoryConfig[],
      },
      { itemsToFilter: ['p1'], skippedItems: [] },
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      'The --onlyPlugins argument removed the following categories: c1, c3.',
    );
  });

  it('should throw OptionValidationError when none of the provided slugs are present in plugins', () => {
    expect(() => {
      validateFilterOption(
        'onlyPlugins',
        {
          plugins: [
            { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
            { slug: 'p2', audits: [{ slug: 'a1-p2' }] },
            { slug: 'p3', audits: [{ slug: 'a1-p3' }] },
          ] as PluginConfig[],
        },
        { itemsToFilter: ['p4', 'p5'], skippedItems: [] },
      );
    }).toThrow(
      new OptionValidationError(
        'The --onlyPlugins argument references plugins that do not exist: p4, p5. Valid plugins are p1, p2, p3.',
      ),
    );
  });

  it('should throw OptionValidationError when none of the onlyPlugins are valid', () => {
    const allPlugins = [
      { slug: 'plugin1', audits: [{ slug: 'a1-p1' }] },
      { slug: 'plugin2', audits: [{ slug: 'a1-p2' }] },
    ] as PluginConfig[];

    expect(() => {
      validateFilterOption(
        'skipPlugins',
        { plugins: allPlugins },
        { itemsToFilter: ['plugin1'], skippedItems: [] },
      );
      validateFilterOption(
        'onlyPlugins',
        { plugins: allPlugins },
        { itemsToFilter: ['plugin3'], skippedItems: [] },
      );
    }).toThrow(
      new OptionValidationError(
        'The --onlyPlugins argument references a plugin that does not exist: plugin3. Valid plugins are plugin1, plugin2.',
      ),
    );
  });

  it('should throw OptionValidationError when none of the onlyCategories are valid', () => {
    expect(() => {
      validateFilterOption(
        'onlyCategories',
        {
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
        },
        { itemsToFilter: ['c2', 'c3'], skippedItems: [] },
      );
    }).toThrow(
      new OptionValidationError(
        'The --onlyCategories argument references categories that do not exist: c2, c3. The only valid category is c1.',
      ),
    );
  });

  it('should log skipped items if verbose mode is enabled', () => {
    logger.setVerbose(true);

    const plugins = [
      { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
    ] as PluginConfig[];
    const categories = [
      { slug: 'c1', refs: [{ plugin: 'p1', slug: 'a1-p1' }] },
    ] as CategoryConfig[];

    validateFilterOption(
      'skipPlugins',
      { plugins, categories },
      { itemsToFilter: ['p1'], skippedItems: ['p1'] },
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'The --skipPlugins argument references a skipped plugin: p1.',
    );
    expect(logger.info).toHaveBeenCalledWith(
      'The --skipPlugins argument removed the following categories: c1.',
    );
  });
});

describe('createValidationMessage', () => {
  it.each([
    [
      'onlyPlugins',
      ['wrong-slug'],
      ['plugin1', 'plugin2', 'plugin3'],
      'The --onlyPlugins argument references a plugin that does not exist: wrong-slug. Valid plugins are plugin1, plugin2, plugin3.',
    ],
    [
      'skipPlugins',
      ['wrong-slug1', 'wrong-slug2'],
      ['plugin1', 'plugin2', 'plugin3'],
      'The --skipPlugins argument references plugins that do not exist: wrong-slug1, wrong-slug2. Valid plugins are plugin1, plugin2, plugin3.',
    ],
    [
      'onlyPlugins',
      ['wrong-slug'],
      ['plugin1'],
      'The --onlyPlugins argument references a plugin that does not exist: wrong-slug. The only valid plugin is plugin1.',
    ],
    [
      'skipPlugins',
      ['wrong-slug1', 'wrong-slug2'],
      ['plugin1'],
      'The --skipPlugins argument references plugins that do not exist: wrong-slug1, wrong-slug2. The only valid plugin is plugin1.',
    ],
    [
      'onlyCategories',
      ['wrong-slug'],
      ['category1', 'category2', 'category3'],
      'The --onlyCategories argument references a category that does not exist: wrong-slug. Valid categories are category1, category2, category3.',
    ],
    [
      'skipCategories',
      ['wrong-slug1', 'wrong-slug2'],
      ['category1'],
      'The --skipCategories argument references categories that do not exist: wrong-slug1, wrong-slug2. The only valid category is category1.',
    ],
  ])(
    'should create a validation message for %s with invalid plugins %o and valid plugins %o',
    (option, invalidPlugins, validPlugins, expected) => {
      expect(
        createValidationMessage(
          option as FilterOptionType,
          invalidPlugins,
          new Set(validPlugins),
        ),
      ).toBe(expected);
    },
  );
});

describe('handleConflictingOptions', () => {
  it.each([
    [
      'plugins',
      ['plugin1'],
      ['plugin1'],
      'The following plugin is specified in both --onlyPlugins and --skipPlugins: plugin1. Please choose one option.',
    ],
    [
      'categories',
      ['category1'],
      ['category1'],
      'The following category is specified in both --onlyCategories and --skipCategories: category1. Please choose one option.',
    ],
    [
      'plugins',
      ['plugin1', 'plugin2'],
      ['plugin1', 'plugin2'],
      'The following plugins are specified in both --onlyPlugins and --skipPlugins: plugin1, plugin2. Please choose one option.',
    ],
  ])(
    'should throw OptionValidationError for conflicting onlyPlugins %o and skipPlugins %o',
    (optionType, onlyPlugins, skipPlugins, message) => {
      expect(() => {
        handleConflictingOptions(
          optionType as 'plugins' | 'categories',
          onlyPlugins,
          skipPlugins,
        );
      }).toThrow(new OptionValidationError(message));
    },
  );

  it('should check for conflicts without throwing an error when there is none', () => {
    expect(() => {
      handleConflictingOptions('plugins', ['plugin2'], ['plugin1']);
    }).not.toThrow();
  });

  it('should check for conflicts without throwing an error when both options are empty', () => {
    expect(() => {
      handleConflictingOptions('categories', [], []);
    }).not.toThrow();
  });
});

describe('validateFinalState', () => {
  it('should throw OptionValidationError when all plugins and categories are filtered out', () => {
    const filteredItems = { categories: [], plugins: [] };
    const originalItems = {
      plugins: [{ slug: 'p1', audits: [{ slug: 'a1-p1' }] }] as PluginConfig[],
      categories: [
        { slug: 'c1', refs: [{ plugin: 'p1', slug: 'a1-p1' }] },
      ] as CategoryConfig[],
    };
    expect(() => {
      validateFinalState(filteredItems, originalItems);
    }).toThrow(expect.any(OptionValidationError));
  });

  it('should perform validation without throwing an error when categories are missing', () => {
    const filteredItems = {
      plugins: [
        {
          slug: 'p1',
          audits: [{ slug: 'a1-p1' }],
          groups: [{ slug: 'g1-p1', refs: [{ slug: 'a1-p1', weight: 1 }] }],
        },
      ] as PluginConfig[],
    };
    const originalItems = {
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
      ] as PluginConfig[],
    };
    expect(() => {
      validateFinalState(filteredItems, originalItems);
    }).not.toThrow();
  });

  it('should throw OptionValidationError when all groups in plugins have zero weight', () => {
    const items = {
      plugins: [
        {
          slug: 'p1',
          audits: [
            { slug: 'a1', isSkipped: false },
            { slug: 'a2', isSkipped: false },
          ],
          groups: [
            { slug: 'g1', refs: [{ slug: 'a1', weight: 0 }], isSkipped: false },
            { slug: 'g2', refs: [{ slug: 'a2', weight: 0 }], isSkipped: false },
          ],
        },
      ] as PluginConfig[],
    };
    expect(() => {
      validateFinalState(items, items);
    }).toThrow(
      new OptionValidationError(
        'Some groups in the filtered plugins have only zero-weight references. Please adjust your filters or weights.',
      ),
    );
  });

  it('should throw an error when at least one group has all zero-weigh refs', () => {
    const items = {
      plugins: [
        {
          slug: 'p1',
          audits: [
            { slug: 'a1', isSkipped: false },
            { slug: 'a2', isSkipped: false },
          ],
          groups: [
            { slug: 'g1', refs: [{ slug: 'a1', weight: 1 }], isSkipped: false },
            { slug: 'g2', refs: [{ slug: 'a2', weight: 0 }], isSkipped: false },
          ],
        },
      ] as PluginConfig[],
    };
    expect(() => {
      validateFinalState(items, items);
    }).toThrow(
      'Some groups in the filtered plugins have only zero-weight references. Please adjust your filters or weights.',
    );
  });
});

describe('getItemType', () => {
  it.each([
    ['onlyCategories', 1, 'category'],
    ['skipCategories', 3, 'categories'],
    ['onlyPlugins', 1, 'plugin'],
    ['skipPlugins', 2, 'plugins'],
    ['', 0, 'items'],
  ])(
    'should get the item type based on option %s and count %d',
    (option, count, expected) => {
      expect(getItemType(option as FilterOptionType, count)).toBe(expected);
    },
  );
});

describe('validateSkippedCategories', () => {
  const categories = [
    {
      slug: 'c1',
      refs: [{ type: 'group', plugin: 'p1', slug: 'g1', weight: 0 }],
    },
    {
      slug: 'c2',
      refs: [{ type: 'audit', plugin: 'p2', slug: 'a1', weight: 1 }],
    },
  ] as NonNullable<Filterables['categories']>;

  it('should log info when categories are removed', () => {
    logger.setVerbose(true);

    validateSkippedCategories(categories, [
      {
        slug: 'c2',
        refs: [{ type: 'audit', plugin: 'p2', slug: 'a1', weight: 1 }],
      },
    ] as NonNullable<Filterables['categories']>);
    expect(logger.info).toHaveBeenCalledWith(
      'Category c1 was removed because all its refs were skipped. Affected refs: g1 (group)',
    );
  });

  it('should not log anything when categories are not removed', () => {
    validateSkippedCategories(categories, categories);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('should throw an error when no categories remain after filtering', () => {
    expect(() => validateSkippedCategories(categories, [])).toThrow(
      new OptionValidationError(
        'No categories remain after filtering. Removed categories: c1, c2',
      ),
    );
  });
});

describe('pluginHasZeroWeightRefs', () => {
  it('should return true if any group has all refs with zero weight', () => {
    expect(
      pluginHasZeroWeightRefs({
        groups: [
          {
            slug: 'g1',
            refs: [
              { slug: 'a1', weight: 0 },
              { slug: 'a2', weight: 0 },
            ],
          },
          {
            slug: 'g2',
            refs: [
              { slug: 'a3', weight: 1 },
              { slug: 'a4', weight: 0 },
            ],
          },
        ],
      } as PluginConfig),
    ).toBe(true);
  });

  it('should return false if any ref has non-zero weight', () => {
    expect(
      pluginHasZeroWeightRefs({
        groups: [
          {
            slug: 'g1',
            refs: [
              { slug: 'a1', weight: 1 },
              { slug: 'a2', weight: 0 },
            ],
          },
          {
            slug: 'g2',
            refs: [
              { slug: 'a3', weight: 1 },
              { slug: 'a4', weight: 0 },
            ],
          },
        ],
      } as PluginConfig),
    ).toBe(false);
  });

  it('should return false if there are no groups', () => {
    expect(pluginHasZeroWeightRefs({ groups: undefined } as PluginConfig)).toBe(
      false,
    );
  });
});
