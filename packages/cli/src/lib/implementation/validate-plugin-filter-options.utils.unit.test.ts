import { describe, expect } from 'vitest';
import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import {
  OptionValidationError,
  createValidationMessage,
  handleConflictingPlugins,
  validatePluginFilterOption,
} from './validate-plugin-filter-options.utils';

describe('validatePluginFilterOption', () => {
  describe('onlyPlugins', () => {
    it('should log a warning if the onlyPlugins argument contains multiple nonexistent plugins along with a valid one', () => {
      validatePluginFilterOption(
        'onlyPlugins',
        {
          plugins: [{ slug: 'plugin1', audits: [{}] }] as PluginConfig[],
          categories: [],
        },
        { pluginsToFilter: ['plugin1', 'plugin3', 'plugin4'] },
      );
      const logs = getLogMessages(ui().logger);
      expect(logs[0]).toContain(
        'The --onlyPlugins argument references plugins that do not exist: plugin3, plugin4.',
      );
    });

    it('should log a warning if the onlyPlugins argument contains one nonexistent plugin along with a valid one', () => {
      validatePluginFilterOption(
        'onlyPlugins',
        {
          plugins: [
            { slug: 'plugin1', audits: [{ slug: 'a1' }] },
          ] as PluginConfig[],
          categories: [],
        },
        { pluginsToFilter: ['plugin1', 'plugin2'] },
      );
      const logs = getLogMessages(ui().logger);
      expect(logs[0]).toContain(
        'The --onlyPlugins argument references a plugin that does not exist: plugin2.',
      );
    });

    it('should throw OptionValidationError when none of the provided slugs are present in plugins', () => {
      expect(() => {
        validatePluginFilterOption(
          'onlyPlugins',
          {
            plugins: [
              { slug: 'plugin1', audits: [{ slug: 'a1-p1' }] },
              { slug: 'plugin2', audits: [{ slug: 'a1-p2' }] },
              { slug: 'plugin3', audits: [{ slug: 'a1-p3' }] },
            ] as PluginConfig[],
            categories: [],
          },
          { pluginsToFilter: ['plugin4', 'plugin5'] },
        );
      }).toThrow(
        new OptionValidationError(
          'The --onlyPlugins argument references plugins that do not exist: plugin4, plugin5. Valid plugins are plugin1, plugin2, plugin3.',
        ),
      );
    });

    it('should not log anything if the onlyPlugins argument contains only valid plugins', () => {
      validatePluginFilterOption(
        'onlyPlugins',
        {
          plugins: [
            { slug: 'plugin1', audits: [{ slug: 'a1-p1' }] },
            { slug: 'plugin2', audits: [{ slug: 'a1-p2' }] },
          ] as PluginConfig[],
          categories: [],
        },
        { pluginsToFilter: ['plugin1'] },
      );
      expect(getLogMessages(ui().logger)).toHaveLength(0);
    });

    it('should print ignored category and its first violating plugin', () => {
      validatePluginFilterOption(
        'onlyPlugins',
        {
          plugins: [
            { slug: 'plugin1', audits: [{ slug: 'a1-p1' }] },
            { slug: 'plugin2', audits: [{ slug: 'a1-p2' }] },
          ] as PluginConfig[],
          categories: [
            { slug: 'c1', refs: [{ plugin: 'plugin2' }] } as CategoryConfig,
            { slug: 'c2', refs: [{ plugin: 'plugin1' }] } as CategoryConfig,
            { slug: 'c3', refs: [{ plugin: 'plugin2' }] } as CategoryConfig,
          ],
        },
        {
          pluginsToFilter: ['plugin1'],
          verbose: true,
        },
      );
      expect(getLogMessages(ui().logger)).toHaveLength(1);
      expect(getLogMessages(ui().logger)[0]).toContain(
        'The --onlyPlugins argument removed the following categories: c1, c3',
      );
    });
  });

  describe('skipPlugins', () => {
    it('should log a warning if the skipPlugins argument contains multiple nonexistent plugins', () => {
      validatePluginFilterOption(
        'skipPlugins',
        {
          plugins: [
            { slug: 'plugin1', audits: [{ slug: 'a1' }] },
          ] as PluginConfig[],
          categories: [],
        },
        { pluginsToFilter: ['plugin1', 'plugin3', 'plugin4'] },
      );
      const logs = getLogMessages(ui().logger);
      expect(logs[0]).toContain(
        'The --skipPlugins argument references plugins that do not exist: plugin3, plugin4.',
      );
    });

    it('should log a warning if the skipPlugins argument contains one nonexistent plugin', () => {
      validatePluginFilterOption(
        'skipPlugins',
        {
          plugins: [
            { slug: 'plugin1', audits: [{ slug: 'a1' }] },
          ] as PluginConfig[],
          categories: [],
        },
        { pluginsToFilter: ['plugin1', 'plugin2'] },
      );
      const logs = getLogMessages(ui().logger);
      expect(logs[0]).toContain(
        'The --skipPlugins argument references a plugin that does not exist: plugin2.',
      );
    });

    it('should not log anything if the skipPlugins argument contains only valid plugins', () => {
      validatePluginFilterOption(
        'skipPlugins',
        {
          plugins: [
            { slug: 'plugin1', audits: [{ slug: 'a1-p1' }] },
            { slug: 'plugin2', audits: [{ slug: 'a1-p2' }] },
          ] as PluginConfig[],
          categories: [],
        },
        {
          pluginsToFilter: ['plugin1'],
          verbose: true,
        },
      );
      expect(getLogMessages(ui().logger)).toHaveLength(0);
    });

    it('should print ignored category and its first violating plugin', () => {
      validatePluginFilterOption(
        'skipPlugins',
        {
          plugins: [
            { slug: 'plugin1', audits: [{ slug: 'a1-p1' }] },
            { slug: 'plugin2', audits: [{ slug: 'a1-p2' }] },
          ] as PluginConfig[],
          categories: [
            { slug: 'c1', refs: [{ plugin: 'plugin2' }] } as CategoryConfig,
            { slug: 'c2', refs: [{ plugin: 'plugin1' }] } as CategoryConfig,
            { slug: 'c3', refs: [{ plugin: 'plugin2' }] } as CategoryConfig,
          ],
        },
        {
          pluginsToFilter: ['plugin2'],
          verbose: true,
        },
      );
      expect(getLogMessages(ui().logger)).toHaveLength(1);
      expect(getLogMessages(ui().logger)[0]).toContain(
        'The --skipPlugins argument removed the following categories: c1, c3.',
      );
    });
  });

  describe('onlyPlugins and skipPlugins', () => {
    it('should throw OptionValidationError when none of the onlyPlugins are valid', () => {
      const allPlugins = [
        { slug: 'plugin1', audits: [{ slug: 'a1-p1' }] },
        { slug: 'plugin2', audits: [{ slug: 'a1-p2' }] },
      ] as PluginConfig[];

      expect(() => {
        validatePluginFilterOption(
          'skipPlugins',
          { plugins: allPlugins, categories: [] },
          { pluginsToFilter: ['plugin1'] },
        );
        validatePluginFilterOption(
          'onlyPlugins',
          { plugins: allPlugins, categories: [] },
          { pluginsToFilter: ['plugin3'] },
        );
      }).toThrow(
        new OptionValidationError(
          'The --onlyPlugins argument references a plugin that does not exist: plugin3. Valid plugins are plugin1, plugin2.',
        ),
      );
    });
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
  ])(
    'should create a validation message for %s with invalid plugins %o and valid plugins %o',
    (option, invalidPlugins, validPlugins, expected) => {
      expect(
        createValidationMessage(
          option as 'skipPlugins' | 'onlyPlugins',
          invalidPlugins,
          validPlugins.map(slug => ({ slug })),
        ),
      ).toBe(expected);
    },
  );
});

describe('handleConflictingPlugins', () => {
  it.each([
    [
      ['plugin1'],
      ['plugin1'],
      'The following plugin is specified in both --onlyPlugins and --skipPlugins: plugin1. Please choose one option.',
    ],
    [
      ['plugin1', 'plugin2'],
      ['plugin1', 'plugin2'],
      'The following plugins are specified in both --onlyPlugins and --skipPlugins: plugin1, plugin2. Please choose one option.',
    ],
  ])(
    'should throw OptionValidationError for conflicting onlyPlugins %o and skipPlugins %o',
    (onlyPlugins, skipPlugins, message) => {
      expect(() => {
        handleConflictingPlugins(onlyPlugins, skipPlugins);
      }).toThrow(new OptionValidationError(message));
    },
  );

  it('should check for conflicts without throwing an error when there is none', () => {
    expect(() => {
      handleConflictingPlugins(['plugin2'], ['plugin1']);
    }).not.toThrow();
  });

  it('should check for conflicts without throwing an error when both options are empty', () => {
    expect(() => {
      handleConflictingPlugins([], []);
    }).not.toThrow();
  });
});
