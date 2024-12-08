import { describe, expect } from 'vitest';
import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import type { FilterOptionType } from './filter.model.js';
import {
  OptionValidationError,
  createValidationMessage,
  getItemType,
  handleConflictingOptions,
  validateFilterOption,
  validateFinalState,
} from './validate-filter-options.utils.js';

describe('validateFilterOption', () => {
  it.each([
    [
      'onlyPlugins',
      ['p1', 'p3', 'p4'],
      'The --onlyPlugins argument references plugins that do not exist: p3, p4.',
    ],
    [
      'onlyPlugins',
      ['p1', 'p3'],
      'The --onlyPlugins argument references a plugin that does not exist: p3.',
    ],
    [
      'onlyCategories',
      ['c1', 'c3', 'c4'],
      'The --onlyCategories argument references categories that do not exist: c3, c4.',
    ],
    [
      'onlyCategories',
      ['c1', 'c3'],
      'The --onlyCategories argument references a category that does not exist: c3.',
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
        { itemsToFilter, verbose: false },
      );
      const logs = getLogMessages(ui().logger);
      expect(logs[0]).toContain(expected);
    },
  );

  it.each([
    [
      'skipPlugins',
      ['p3', 'p4'],
      'The --skipPlugins argument references plugins that do not exist: p3, p4.',
    ],
    [
      'skipPlugins',
      ['p3'],
      'The --skipPlugins argument references a plugin that does not exist: p3.',
    ],
    [
      'skipCategories',
      ['c3', 'c4'],
      'The --skipCategories argument references categories that do not exist: c3, c4.',
    ],
    [
      'skipCategories',
      ['c3'],
      'The --skipCategories argument references a category that does not exist: c3.',
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
        { itemsToFilter, verbose: false },
      );
      const logs = getLogMessages(ui().logger);
      expect(logs[0]).toContain(expected);
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
      { itemsToFilter: ['p1'], verbose: false },
    );
    expect(getLogMessages(ui().logger)).toHaveLength(0);
  });

  it('should log a category ignored as a result of plugin filtering', () => {
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
      { itemsToFilter: ['p1'], verbose: true },
    );
    expect(getLogMessages(ui().logger)).toHaveLength(1);
    expect(getLogMessages(ui().logger)[0]).toContain(
      'The --onlyPlugins argument removed the following categories: c1, c3',
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
        { itemsToFilter: ['p4', 'p5'], verbose: false },
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
        { itemsToFilter: ['plugin1'], verbose: false },
      );
      validateFilterOption(
        'onlyPlugins',
        { plugins: allPlugins },
        { itemsToFilter: ['plugin3'], verbose: false },
      );
    }).toThrow(
      new OptionValidationError(
        'The --onlyPlugins argument references a plugin that does not exist: plugin3. Valid plugins are plugin1, plugin2.',
      ),
    );
  });

  it('should throw OptionValidationError when none of the onlyCatigories are valid', () => {
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
        { itemsToFilter: ['c2', 'c3'], verbose: false },
      );
    }).toThrow(
      new OptionValidationError(
        'The --onlyCategories argument references categories that do not exist: c2, c3. The only valid category is c1.',
      ),
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
          validPlugins.map(slug => ({ slug })),
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
      plugins: [{ slug: 'p1', audits: [{ slug: 'a1-p1' }] }] as PluginConfig[],
    };
    const originalItems = {
      plugins: [
        { slug: 'p1', audits: [{ slug: 'a1-p1' }] },
        { slug: 'p2', audits: [{ slug: 'a1-p2' }] },
      ] as PluginConfig[],
    };
    expect(() => {
      validateFinalState(filteredItems, originalItems);
    }).not.toThrow();
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
