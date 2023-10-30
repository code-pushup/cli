import { describe, expect, it } from 'vitest';
import { config } from '../../test';
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
    const coreConfig = config();
    expect(() => coreConfigSchema.parse(coreConfig)).not.toThrow();
  });

  it('should throw if the category slugs are not unique', () => {
    const coreConfig = config();
    const duplicatedSlug = coreConfig.categories[0].slug;
    coreConfig.categories = [
      ...coreConfig.categories,
      coreConfig.categories[0],
    ];
    expect(() => coreConfigSchema.parse(coreConfig)).toThrow(
      `In the categories, the following slugs are duplicated: ${duplicatedSlug}`,
    );
  });

  it('should throw if ref in a category does not exist in audits', () => {
    const coreConfig = config();
    const ref = coreConfig.categories[1].refs[0];
    const pluginSlug = ref.plugin;

    const missingAuditSlug = 'missing-audit-ref';
    ref.slug = missingAuditSlug;
    expect(() => coreConfigSchema.parse(coreConfig)).toThrow(
      `In the categories, the following plugin refs do not exist in the provided plugins: ${pluginSlug}/${missingAuditSlug}`,
    );
  });

  it('should throw if ref in a category does not exist in groups', () => {
    const coreConfig = config();
    const categoryConfig = coreConfig.categories[0];
    const ref = { ...categoryConfig.refs[0], slug: 'missing-slug' };
    coreConfig.categories[1].refs.push(ref);
    console.log('refs[0]', categoryConfig.refs[0]);

    expect(() => coreConfigSchema.parse(coreConfig)).toThrow(
      `In the categories, the following plugin refs do not exist in the provided plugins: lighthouse#missing-slug (group)`,
    );
  });
});
