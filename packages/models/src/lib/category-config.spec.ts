import { describe, expect, it } from 'vitest';
import { categoryConfigSchema } from './category-config';
import { mockCategory } from '../../test';

describe('categoryConfigSchema', () => {
  it('should parse if configuration with audit refs is valid', () => {
    const cfg = mockCategory({
      pluginSlug: 'test',
      auditSlug: 'a',
    });
    expect(() => categoryConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should parse if configuration with group refs is valid', () => {
    const cfg = mockCategory({
      pluginSlug: 'test',
      groupSlug: 'g',
    });
    expect(() => categoryConfigSchema.parse(cfg)).not.toThrow();
  });

  it('should throw if duplicate refs to audits or groups in metrics are given', () => {
    const duplicatedSlug = 'a';
    const cfg = mockCategory({
      auditSlug: [duplicatedSlug, duplicatedSlug],
    });
    expect(() => categoryConfigSchema.parse(cfg)).toThrow(
      'the following audit or group refs are duplicates',
    );
  });
});
