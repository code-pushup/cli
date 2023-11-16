import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { SpyInstance, afterEach, beforeEach, describe, expect } from 'vitest';
import { CoreConfig } from '@code-pushup/models';
import {
  configMiddleware,
  filterCategoryByOnlyPluginsOption,
  filterPluginsByOnlyPluginsOption,
  validateOnlyPluginsOption,
} from './config-middleware';

const __dirname = dirname(fileURLToPath(import.meta.url));
const withDirName = (path: string) => join(__dirname, path);
const config = (ext: string) =>
  withDirName(join('..', '..', '..', 'test', `js-format.config.mock.${ext}`));

describe('applyConfigMiddleware', () => {
  it('should load valid .ts config', async () => {
    const configPathMjs = config('ts');
    const _config = await configMiddleware({ config: configPathMjs });
    expect(_config?.upload?.project).toContain('ts');
    expect(_config.persist.outputDir).toContain('tmp');
  });
  it('should load valid .mjs config', async () => {
    const configPathMjs = config('mjs');
    const _config = await configMiddleware({ config: configPathMjs });
    expect(_config?.upload?.project).toContain('mjs');
    expect(_config.persist.outputDir).toContain('tmp');
  });

  it('should load valid .cjs config', async () => {
    const configPathCjs = config('cjs');
    const _config = await configMiddleware({ config: configPathCjs });
    expect(_config?.upload?.project).toContain('cjs');
    expect(_config.persist.outputDir).toContain('tmp');
  });

  it('should load valid .js config', async () => {
    const configPathJs = config('js');
    const _config = await configMiddleware({ config: configPathJs });
    expect(_config?.upload?.project).toContain('js');
    expect(_config.persist.outputDir).toContain('tmp');
  });

  it('should throw with invalid config', async () => {
    const invalidConfig = join('wrong', 'path', 'to', 'config');
    let error: Error = new Error();
    await configMiddleware({ config: invalidConfig }).catch(e => (error = e));
    expect(error?.message).toContain(invalidConfig);
  });

  it('should provide default config path', async () => {
    const defaultConfigPath = 'code-pushup.config.js';
    let error: Error = new Error();
    await configMiddleware({ config: defaultConfigPath }).catch(
      e => (error = e),
    );
    expect(error?.message).toContain(defaultConfigPath);
  });
});

describe('filterPluginsByOnlyPluginsOption', () => {
  it('should return all plugins if no onlyPlugins option', async () => {
    const plugins = [
      { slug: 'plugin1' },
      { slug: 'plugin2' },
      { slug: 'plugin3' },
    ];
    const filtered = filterPluginsByOnlyPluginsOption(
      plugins as CoreConfig['plugins'],
      {},
    );
    expect(filtered).toEqual(plugins);
  });

  it('should return only plugins with matching slugs', () => {
    const plugins = [
      { slug: 'plugin1' },
      { slug: 'plugin2' },
      { slug: 'plugin3' },
    ];
    const filtered = filterPluginsByOnlyPluginsOption(
      plugins as CoreConfig['plugins'],
      {
        onlyPlugins: ['plugin1', 'plugin3'],
      },
    );
    expect(filtered).toEqual([{ slug: 'plugin1' }, { slug: 'plugin3' }]);
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
    const categories = [
      { refs: [{ slug: 'plugin1' }, { slug: 'plugin2' }] },
      { refs: [{ slug: 'plugin3' }] },
    ];
    const filtered = filterCategoryByOnlyPluginsOption(
      categories as CoreConfig['categories'],
      {},
    );
    expect(filtered).toEqual(categories);
  });

  it('should return only categories with matching slugs', () => {
    const categories = [
      { refs: [{ slug: 'plugin1' }, { slug: 'plugin2' }] },
      { refs: [{ slug: 'plugin3' }] },
    ];
    const filtered = filterCategoryByOnlyPluginsOption(
      categories as CoreConfig['categories'],
      {
        onlyPlugins: ['plugin1', 'plugin3'],
      },
    );
    expect(filtered).toEqual([{ refs: [{ slug: 'plugin3' }] }]);
  });

  it('should log if category is ignored', () => {
    const categories = [
      { title: 'category1', refs: [{ slug: 'plugin1' }, { slug: 'plugin2' }] },
      { title: 'category2', refs: [{ slug: 'plugin3' }] },
    ];
    filterCategoryByOnlyPluginsOption(categories as CoreConfig['categories'], {
      onlyPlugins: ['plugin1', 'plugin3'],
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"category1"'));
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
    const plugins = [{ slug: 'plugin1' }, { slug: 'plugin2' }];
    validateOnlyPluginsOption(plugins as CoreConfig['plugins'], {
      onlyPlugins: ['plugin1', 'plugin3'],
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"plugin3"'));
  });

  it('should not log if onlyPlugins option contains existing plugin', () => {
    const plugins = [{ slug: 'plugin1' }, { slug: 'plugin2' }];
    validateOnlyPluginsOption(plugins as CoreConfig['plugins'], {
      onlyPlugins: ['plugin1'],
    });
    expect(logSpy).not.toHaveBeenCalled();
  });
});
