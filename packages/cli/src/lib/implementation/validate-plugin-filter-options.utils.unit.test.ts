import { describe, expect } from 'vitest';
import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { validatePluginFilterOption } from './validate-plugin-filter-options.utils';

describe('validatePluginFilterOption', () => {
  describe('onlyPlugins', () => {
    it('should log a warning if the onlyPlugins argument contains multiple nonexistent plugins', () => {
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

    it('should log a warning if the onlyPlugins argument contains one nonexistent plugin', () => {
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

    it('should include all valid plugin slugs in a warning', () => {
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
        { pluginsToFilter: ['plugin4'] },
      );
      const logs = getLogMessages(ui().logger);
      expect(logs[0]).toContain(
        'The valid plugin slugs are plugin1, plugin2, plugin3.',
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
});
