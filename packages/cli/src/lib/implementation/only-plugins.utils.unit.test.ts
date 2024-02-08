import {afterEach, beforeAll, describe, expect} from 'vitest';
import {CategoryConfig, CoreConfig} from '@code-pushup/models';
import {ui} from '@code-pushup/utils';
import {
  filterCategoryByPluginSlug,
  filterPluginsBySlug,
  validateOnlyPluginsOption,
} from './only-plugins.utils';

describe('filterPluginsBySlug', () => {


  it('should return all plugins if no onlyPlugins option is provided', () => {
    expect(
      filterPluginsBySlug(
        [
          {slug: 'plugin1'},
          {slug: 'plugin2'},
          {slug: 'plugin3'},
        ] as CoreConfig['plugins'],
        {},
      ),
    ).toEqual([{slug: 'plugin1'}, {slug: 'plugin2'}, {slug: 'plugin3'}]);
  });

  it('should return only plugins with matching slugs', () => {
    expect(
      filterPluginsBySlug(
        [
          {slug: 'plugin1'},
          {slug: 'plugin2'},
          {slug: 'plugin3'},
        ] as CoreConfig['plugins'],
        {onlyPlugins: ['plugin1', 'plugin3']},
      ),
    ).toEqual([{slug: 'plugin1'}, {slug: 'plugin3'}]);
  });
});

describe('filterCategoryByPluginSlug', () => {
  beforeAll(() => {
    ui().switchMode('raw');
  });
  afterEach(() => {
    ui().flushLogs();
  });
  it('should return all categories if no onlyPlugins option', () => {
    expect(
      filterCategoryByPluginSlug(
        [
          {refs: [{slug: 'plugin1'}, {slug: 'plugin2'}]},
          {refs: [{slug: 'plugin3'}]},
        ] as CategoryConfig[],
        {},
      ),
    ).toEqual([
      {refs: [{slug: 'plugin1'}, {slug: 'plugin2'}]},
      {refs: [{slug: 'plugin3'}]},
    ]);
  });

  it('should return categories containing only defined plugins', () => {
    expect(
      filterCategoryByPluginSlug(
        [
          {refs: [{slug: 'plugin1'}, {slug: 'plugin2'}]},
          {refs: [{slug: 'plugin3'}]},
        ] as CategoryConfig[],
        {onlyPlugins: ['plugin1', 'plugin3']},
      ),
    ).toEqual([{refs: [{slug: 'plugin3'}]}]);
  });

  it('should print ignored category and its first violating plugin', () => {
    filterCategoryByPluginSlug(
      [
        {
          title: 'category1',
          refs: [{slug: 'plugin1'}, {slug: 'plugin2'}, {slug: 'plugin4'}],
        },
        {title: 'category2', refs: [{slug: 'plugin3'}]},
      ] as CategoryConfig[],
      {
        onlyPlugins: ['plugin1', 'plugin3'],
        verbose: true,
      },
    )
    const logs = ui().logger.getRenderer().getLogs().map(({message}) => message);
    expect(logs[0]).toBe('"category1" is ignored');
    expect(logs[0]).toBe('skipped plugin "plugin2"');
  });
});

describe('validateOnlyPluginsOption', () => {
  beforeAll(() => {
    ui().switchMode('raw');
  });
  afterEach(() => {
    ui().flushLogs();
  });

  it('should warn if onlyPlugins option contains non-existing plugin', () => {
    validateOnlyPluginsOption(
      [{slug: 'plugin1'}, {slug: 'plugin2'}] as CoreConfig['plugins'],
      {
        onlyPlugins: ['plugin1', 'plugin3', 'plugin4'],
        verbose: true,
      },
    );
    const logs = ui().logger.getRenderer().getLogs().map(({message}) => message);
    expect(logs[0]).toBe(
        'plugins with "plugin3", "plugin4" slugs, but no such plugins are present'
    );
  });

  it('should not log if onlyPlugins option contains only existing plugins', () => {
    validateOnlyPluginsOption(
      [{slug: 'plugin1'}, {slug: 'plugin2'}] as CoreConfig['plugins'],
      {
        onlyPlugins: ['plugin1'],
        verbose: true,
      },
    );
    const logs = ui().logger.getRenderer().getLogs().map(({message}) => message);
    expect(logs).toHaveLength(0);
  });
});
