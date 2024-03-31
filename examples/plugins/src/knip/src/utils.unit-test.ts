import { describe, expect, it } from 'vitest';
import { categoryRefSchema } from '@code-pushup/models';
import { KNIP_PLUGIN_SLUG } from './constants';
import { knipCategoryAuditRef, knipCategoryGroupRef } from './utils';

describe('knipCategoryAuditRef', () => {
  it('should return correct audit category reference object and set weight to 1 by default', () => {
    const categoryRef = categoryRefSchema.parse(knipCategoryAuditRef('files'));
    expect(categoryRef.slug).toBe('files');
    expect(categoryRef.type).toBe('audit');
    expect(categoryRef.plugin).toBe(KNIP_PLUGIN_SLUG);
    expect(categoryRef.weight).toBe(1);
  });

  it('should return correct audit category reference object and with weight 0', () => {
    const categoryRef = categoryRefSchema.parse(
      knipCategoryAuditRef('files', 0),
    );
    expect(categoryRef.slug).toBe('files');
    expect(categoryRef.type).toBe('audit');
    expect(categoryRef.plugin).toBe(KNIP_PLUGIN_SLUG);
    expect(categoryRef.weight).toBe(0);
  });
});

describe('knipCategoryGroupRef', () => {
  it('should return correct group category reference object and set weight to 1 by default', () => {
    const categoryRef = categoryRefSchema.parse(knipCategoryGroupRef('files'));
    expect(categoryRef.slug).toBe('files');
    expect(categoryRef.type).toBe('audit');
    expect(categoryRef.plugin).toBe(KNIP_PLUGIN_SLUG);
    expect(categoryRef.weight).toBe(1);
  });

  it('should return correct group category reference object and with weight 0', () => {
    const categoryRef = categoryRefSchema.parse(
      knipCategoryGroupRef('files', 0),
    );
    expect(categoryRef.slug).toBe('files');
    expect(categoryRef.type).toBe('audit');
    expect(categoryRef.plugin).toBe(KNIP_PLUGIN_SLUG);
    expect(categoryRef.weight).toBe(0);
  });
});
