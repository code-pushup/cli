import { describe, expect, it } from 'vitest';
import { mockCategory } from './implementation/helpers.mock';
import { categoryConfigSchema } from './category-config';

describe('categoryConfigSchema', () => {
  it('should parse if configuration with audit refs is valid', () => {
    const cfg = mockCategory({ auditRefOrGroupRef: ['test#a', 'test#b'] });
    expect(() => categoryConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should parse if configuration with group refs is valid', () => {
    const cfg = mockCategory({ auditRefOrGroupRef: ['es-lint#group:base'] });
    expect(() => categoryConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should throw if category slug has a invalid pattern', () => {
    const invalidCategorySlug = '-invalid-category-slug';
    const cfg = mockCategory({ categorySlug: invalidCategorySlug });

    expect(() => categoryConfigSchema.parse(cfg)).toThrow(
      `slug has to follow the pattern`,
    );
  });

  it('should throw if audit ref in metrics is invalid', () => {
    const invalidAuditRef = 'no-any';
    const cfg = mockCategory({ auditRefOrGroupRef: [invalidAuditRef] });

    expect(() => categoryConfigSchema.parse(cfg)).toThrow(
      `ref has to follow the patter`,
    );
  });

  it('should throw if duplicate refs to audits or groups in metrics are given', () => {
    const duplicatedSlug = 'test#a';
    const cfg = mockCategory({
      auditRefOrGroupRef: [duplicatedSlug, duplicatedSlug],
    });
    expect(() => categoryConfigSchema.parse(cfg)).toThrow(
      'the following audit or group refs are duplicates',
    );
  });
});
