import { describe, expect, it } from 'vitest';
import { categoryConfigSchema } from './category-config';
import { mockCategory } from './implementation/helpers.mock';

describe('categoryConfigSchema', () => {
  it('should parse if configuration with audit refs is valid', () => {
    const cfg = mockCategory({
      auditRefOrGroupRef: [
        { type: 'audit', plugin: 'test', slug: 'a' },
        { type: 'audit', plugin: 'test', slug: 'b' },
      ],
    });
    expect(() => categoryConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should parse if configuration with group refs is valid', () => {
    const cfg = mockCategory({
      auditRefOrGroupRef: [{ type: 'group', plugin: 'es-lint', slug: 'base' }],
    });
    expect(() => categoryConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should throw if duplicate refs to audits or groups in metrics are given', () => {
    const duplicatedSlug = {
      type: 'audit' as const,
      plugin: 'test',
      slug: 'a',
    };
    const cfg = mockCategory({
      auditRefOrGroupRef: [duplicatedSlug, duplicatedSlug],
    });
    expect(() => categoryConfigSchema.parse(cfg)).toThrow(
      'the following audit or group refs are duplicates',
    );
  });
});
