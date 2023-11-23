import { SpyInstance, describe, expect } from 'vitest';
import { CoreConfig } from '@code-pushup/models';
import {
  filterCategoryByOnlyPluginsOption,
  filterPluginsByOnlyPluginsOption,
  validateOnlyPluginsOption,
} from './only-plugins-utils';

describe('filterPluginsByOnlyPluginsOption', () => {
  it('should return all plugins if no onlyPlugins option is provided', () => {
    expect(
      filterPluginsByOnlyPluginsOption(
        [
          { slug: 'plugin1' },
          { slug: 'plugin2' },
          { slug: 'plugin3' },
        ] as CoreConfig['plugins'],
        {},
      ),
    ).toEqual([{ slug: 'plugin1' }, { slug: 'plugin2' }, { slug: 'plugin3' }]);
  });

  it('should return only plugins with matching slugs', () => {
    expect(
      filterPluginsByOnlyPluginsOption(
        [
          { slug: 'plugin1' },
          { slug: 'plugin2' },
          { slug: 'plugin3' },
        ] as CoreConfig['plugins'],
        { onlyPlugins: ['plugin1', 'plugin3'] },
      ),
    ).toEqual([{ slug: 'plugin1' }, { slug: 'plugin3' }]);
  });
});

// without the `no-secrets` rule, this would be flagged as a security issue
// eslint-disable-next-line no-secrets/no-secrets
describe('filterCategoryByOnlyPluginsOption', () => {
  let logSpy: SpyInstance;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log');
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should return all categories if no onlyPlugins option', () => {
    expect(
      filterCategoryByOnlyPluginsOption(
        [
          { refs: [{ slug: 'plugin1' }, { slug: 'plugin2' }] },
          { refs: [{ slug: 'plugin3' }] },
        ] as CoreConfig['categories'],
        {},
      ),
    ).toEqual([
      { refs: [{ slug: 'plugin1' }, { slug: 'plugin2' }] },
      { refs: [{ slug: 'plugin3' }] },
    ]);
  });

  it('should return categories containing only defined plugins', () => {
    expect(
      filterCategoryByOnlyPluginsOption(
        [
          { refs: [{ slug: 'plugin1' }, { slug: 'plugin2' }] },
          { refs: [{ slug: 'plugin3' }] },
        ] as CoreConfig['categories'],
        { onlyPlugins: ['plugin1', 'plugin3'] },
      ),
    ).toEqual([{ refs: [{ slug: 'plugin3' }] }]);
  });

  it('should log ignored category and its first violating plugin', () => {
    filterCategoryByOnlyPluginsOption(
      [
        {
          title: 'category1',
          refs: [{ slug: 'plugin1' }, { slug: 'plugin2' }, { slug: 'plugin4' }],
        },
        { title: 'category2', refs: [{ slug: 'plugin3' }] },
      ] as CoreConfig['categories'],
      {
        onlyPlugins: ['plugin1', 'plugin3'],
      },
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"category1" is ignored'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('skipped plugin "plugin2"'),
    );
  });
});

describe('validateOnlyPluginsOption', () => {
  let logSpy: SpyInstance;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log');
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should log if onlyPlugins option contains non-existing plugin', () => {
    validateOnlyPluginsOption(
      [{ slug: 'plugin1' }, { slug: 'plugin2' }] as CoreConfig['plugins'],
      {
        onlyPlugins: ['plugin1', 'plugin3', 'plugin4'],
      },
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'plugins with "plugin3", "plugin4" slugs, but no such plugins are present',
      ),
    );
  });

  it('should not log if onlyPlugins option contains only existing plugins', () => {
    validateOnlyPluginsOption(
      [{ slug: 'plugin1' }, { slug: 'plugin2' }] as CoreConfig['plugins'],
      {
        onlyPlugins: ['plugin1'],
      },
    );
    expect(logSpy).not.toHaveBeenCalled();
  });
});
