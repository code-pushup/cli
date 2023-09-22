import { describe, expect, it } from 'vitest';
import { coreConfigSchema } from './core-config';
import { mockCategory, mockCoreConfig, mockPluginConfig } from '../../test';

/*
 - plugin slug: es-lint
 - audit slug: no-any
 - group slug: basics
   - audit: no-any
 - category: best-practices

 - from category to audit: es-lint#no-any
 - from category to group: es-lint#group:basics
  */
describe('CoreConfig', () => {
  it('should parse if configuration is valid', () => {
    const cfg = mockCoreConfig({ pluginSlug: 'test', auditSlug: ['a', 'b'] });
    cfg.categories = [
      mockCategory({
        pluginSlug: 'test',
        auditSlug: ['a', 'b'],
      }),
    ];
    expect(() => coreConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should parse if configuration and groups are valid', () => {
    const pluginSlug = 'plg';
    const cfg = mockCoreConfig();
    cfg.plugins = [
      mockPluginConfig({ pluginSlug, auditSlug: 'lcp', groupSlug: 'perf' }),
    ];
    cfg.categories = [
      mockCategory({
        pluginSlug,
        groupSlug: ['perf'],
        auditSlug: ['lcp'],
      }),
    ];
    // In the categories, the following plugin refs do not exist in the provided plugins: test#group:group-slug
    expect(() => coreConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should throw if the category slugs are not unique', () => {
    const cfg = mockCoreConfig({ pluginSlug: 'test', auditSlug: ['a', 'b'] });
    const duplicatedSlug = 'test';
    cfg.categories.push(
      mockCategory({
        categorySlug: 'test',
        auditSlug: ['a'],
      }),
      mockCategory({
        categorySlug: 'test',
        auditSlug: ['b'],
      }),
    );
    expect(() => coreConfigSchema.parse(cfg)).toThrow(
      `In the categories, the following slugs are duplicated: ${duplicatedSlug}`,
    );
  });

  it('should throw if ref in a category does not exist in audits', () => {
    const cfg = mockCoreConfig({ pluginSlug: 'test', auditSlug: ['a', 'b'] });
    cfg.categories = [
      mockCategory({
        pluginSlug: 'test',
        categorySlug: 'test-category',
        auditSlug: ['auditref'],
      }),
    ];
    expect(() => coreConfigSchema.parse(cfg)).toThrow(
      `In the categories, the following plugin refs do not exist in the provided plugins: test/auditref`,
    );
  });

  it('should throw if ref in a category does not exist in groups', () => {
    const cfg = mockCoreConfig({
      pluginSlug: 'test',
      auditSlug: ['a', 'b'],
      groupSlug: 'a',
    });

    cfg.categories = [
      mockCategory({
        pluginSlug: 'test',
        categorySlug: 'test-slug',
        groupSlug: ['groupref'],
      }),
    ];
    expect(() => coreConfigSchema.parse(cfg)).toThrow(
      `In the categories, the following plugin refs do not exist in the provided plugins: test#groupref (group)`,
    );
  });
});
