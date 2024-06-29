import { describe, expect } from 'vitest';
import { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { validateSkipPluginsOption } from './skip-plugins.utils';

describe('validateSkipPluginsOption', () => {
  it('should warn if skipPlugins option contains non-existing plugin', () => {
    validateSkipPluginsOption(
      {
        plugins: [
          { slug: 'plugin1', audits: [{ slug: 'a1' }] },
        ] as PluginConfig[],
        categories: [],
      },
      {
        skipPlugins: ['plugin1', 'plugin3', 'plugin4'],
        verbose: true,
      },
    );
    const logs = getLogMessages(ui().logger);
    expect(logs[0]).toContain(
      'The --skipPlugin argument references plugins with "plugin3", "plugin4" slugs',
    );
  });

  it('should not log if skipPlugins option contains only existing plugins', () => {
    validateSkipPluginsOption(
      {
        plugins: [
          { slug: 'plugin1', audits: [{ slug: 'a1-p1' }] },
          { slug: 'plugin2', audits: [{ slug: 'a1-p2' }] },
        ] as PluginConfig[],
        categories: [],
      },
      {
        skipPlugins: ['plugin1'],
        verbose: true,
      },
    );
    expect(getLogMessages(ui().logger)).toHaveLength(0);
  });

  it('should print ignored category and its first violating plugin', () => {
    validateSkipPluginsOption(
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
        skipPlugins: ['plugin2'],
        verbose: true,
      },
    );
    console.log(getLogMessages(ui().logger));
    expect(getLogMessages(ui().logger)).toHaveLength(1);
    expect(getLogMessages(ui().logger)[0]).toContain(
      'The --skipPlugin argument removed categories with "c1", "c3" slugs',
    );
  });
});
