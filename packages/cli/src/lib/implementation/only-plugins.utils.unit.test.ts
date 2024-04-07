import { describe, expect } from 'vitest';
import { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { validateOnlyPluginsOption } from './only-plugins.utils';

describe('validateOnlyPluginsOption', () => {
  it('should warn if onlyPlugins option contains non-existing plugin', () => {
    validateOnlyPluginsOption(
      {
        plugins: [
          { slug: 'plugin1', audits: [{ slug: 'a1' }] },
        ] as PluginConfig[],
        categories: [],
      },
      {
        onlyPlugins: ['plugin1', 'plugin3', 'plugin4'],
        verbose: true,
      },
    );
    const logs = getLogMessages(ui().logger);
    expect(logs[0]).toContain(
      'The --onlyPlugin argument references plugins with "plugin3", "plugin4" slugs',
    );
  });

  it('should not log if onlyPlugins option contains only existing plugins', () => {
    validateOnlyPluginsOption(
      {
        plugins: [
          { slug: 'plugin1', audits: [{ slug: 'a1-p1' }] },
          { slug: 'plugin2', audits: [{ slug: 'a1-p2' }] },
        ] as PluginConfig[],
        categories: [],
      },
      {
        onlyPlugins: ['plugin1'],
        verbose: true,
      },
    );
    expect(getLogMessages(ui().logger)).toHaveLength(0);
  });

  it('should print ignored category and its first violating plugin', () => {
    validateOnlyPluginsOption(
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
        onlyPlugins: ['plugin1'],
        verbose: true,
      },
    );
    expect(getLogMessages(ui().logger)).toHaveLength(1);
    expect(getLogMessages(ui().logger)[0]).toContain(
      'The --onlyPlugin argument removed categories with "c1", "c3" slugs',
    );
  });
});
