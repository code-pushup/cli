import { describe, expect, it } from 'vitest';
import {
  mockCategory,
  mockConfig,
  mockPluginConfig,
} from './implementation/helpers.mock';
import { coreConfigSchema } from './core-config';

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
    const cfg = mockConfig({ pluginSlug: 'test', auditSlug: ['a', 'b'] });
    cfg.categories.push(
      mockCategory({ auditRefOrGroupRef: ['test#a', 'test#b'] }),
    );
    expect(() => coreConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should parse if configuration and groups are valid', () => {
    const pluginSlug = 'plg';
    const cfg = mockConfig();
    cfg.plugins = [
      mockPluginConfig({ pluginSlug, auditSlug: 'lcp', groupSlug: 'perf' }),
    ];
    cfg.categories = [
      mockCategory({ auditRefOrGroupRef: ['plg#lcp', 'plg#group:perf'] }),
    ];
    // In the categories, the following plugin refs do not exist in the provided plugins: test#group:group-slug
    expect(() => coreConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should throw if the category slugs are not unique', () => {
    const cfg = mockConfig({ pluginSlug: 'test', auditSlug: ['a', 'b'] });
    const duplicatedSlug = 'test';
    cfg.categories.push(
      mockCategory({ categorySlug: 'test', auditRefOrGroupRef: ['test#a'] }),
      mockCategory({ categorySlug: 'test', auditRefOrGroupRef: ['test#b'] }),
    );
    expect(() => coreConfigSchema.parse(cfg)).toThrow(
      `In the categories, the following slugs are duplicated: ${duplicatedSlug}`,
    );
  });

  it('should throw if ref in a category does not exist in audits', () => {
    const cfg = mockConfig({ pluginSlug: 'test', auditSlug: ['a', 'b'] });
    const missingSlug = 'missing-plugin-slug-in-category#auditref';
    cfg.categories.push(
      mockCategory({
        categorySlug: 'test',
        auditRefOrGroupRef: [`${missingSlug}`],
      }),
    );
    expect(() => coreConfigSchema.parse(cfg)).toThrow(
      `In the categories, the following plugin refs do not exist in the provided plugins: ${missingSlug}`,
    );
  });

  it('should throw if ref in a category does not exist in groups', () => {
    const cfg = mockConfig({
      pluginSlug: 'test',
      auditSlug: ['a', 'b'],
      groupSlug: 'test#a',
    });
    const missingSlug = 'missing-plugin-slug-in-category#groups:auditref';
    cfg.categories.push(
      mockCategory({
        categorySlug: 'test',
        auditRefOrGroupRef: [`${missingSlug}`],
      }),
    );
    expect(() => coreConfigSchema.parse(cfg)).toThrow(
      `In the categories, the following plugin refs do not exist in the provided plugins: ${missingSlug}`,
    );
  });
});
