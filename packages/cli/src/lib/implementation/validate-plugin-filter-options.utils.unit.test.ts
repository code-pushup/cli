import { describe, expect } from 'vitest';
import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { validatePluginFilterOption } from './validate-plugin-filter-options.utils';

describe('validatePluginFilterOption', () => {
  describe('onlyPlugins', () => {
    it('should warn if onlyPlugins option contains non-existing plugin', () => {
      validatePluginFilterOption(
        'onlyPlugins',
        {
          plugins: [
            { slug: 'plugin1', audits: [{ slug: 'a1' }] },
          ] as PluginConfig[],
          categories: [],
        },
        {
          pluginsToFilter: ['plugin1', 'plugin3', 'plugin4'],
          verbose: true,
        },
      );
      const logs = getLogMessages(ui().logger);
      expect(logs[0]).toContain(
        'The --onlyPlugins argument references plugins with "plugin3", "plugin4" slugs',
      );
    });

    it('should not log if onlyPlugins option contains only existing plugins', () => {
      validatePluginFilterOption(
        'onlyPlugins',
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
        'The --onlyPlugins argument removed categories with "c1", "c3" slugs',
      );
    });
  });
  describe('skipPlugins', () => {
    it('should warn if skipPlugins option contains non-existing plugin', () => {
      validatePluginFilterOption(
        'skipPlugins',
        {
          plugins: [
            { slug: 'plugin1', audits: [{ slug: 'a1' }] },
          ] as PluginConfig[],
          categories: [],
        },
        {
          pluginsToFilter: ['plugin1', 'plugin3', 'plugin4'],
          verbose: true,
        },
      );
      const logs = getLogMessages(ui().logger);
      expect(logs[0]).toContain(
        'The --skipPlugins argument references plugins with "plugin3", "plugin4" slugs',
      );
    });

    it('should not log if skipPlugins option contains only existing plugins', () => {
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
        'The --skipPlugins argument removed categories with "c1", "c3" slugs',
      );
    });
  });
});
