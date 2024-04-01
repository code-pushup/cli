import { describe, expect, it } from 'vitest';
import { categoryRefSchema, coreConfigSchema } from '@code-pushup/models';
import {
  KNIP_AUDITS,
  KNIP_PLUGIN_SLUG,
  KnipAudits,
  KnipGroups,
} from './constants';
import { knipPlugin } from './knip.plugin';
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

// test if audits and categorie refs are in sync
describe('knipCategoryGroupRef-within-config', () => {
  it.each<KnipGroups>(['all', 'files', 'dependencies', 'exports'])(
    'should be a valid ref within the config for ref %s',
    groupRef => {
      const config = coreConfigSchema.parse({
        plugins: [knipPlugin()],
        categories: [
          {
            slug: 'category-1',
            title: 'category 1',
            refs: [knipCategoryGroupRef(groupRef)],
          },
        ],
      });
      expect(config.categories?.[0]?.refs[0]?.slug).toEqual(groupRef);
      expect(config.categories?.[0]?.refs[0]?.type).toEqual('group');
      expect(config.categories?.[0]?.refs[0]?.plugin).toEqual(KNIP_PLUGIN_SLUG);
      expect(config.categories?.[0]?.refs[0]?.weight).toEqual(1);
    },
  );
});

describe('knipCategoryAuditRef-within-config', () => {
  it.each<KnipAudits>(KNIP_AUDITS.map(({ slug }) => slug))(
    'should be a valid ref within the config for ref %s',
    auditRef => {
      const config = coreConfigSchema.parse({
        plugins: [knipPlugin()],
        categories: [
          {
            slug: 'category-1',
            title: 'category 1',
            refs: [knipCategoryAuditRef(auditRef)],
          },
        ],
      });
      expect(config.categories?.[0]?.refs[0]?.slug).toEqual(auditRef);
      expect(config.categories?.[0]?.refs[0]?.type).toEqual('audit');
      expect(config.categories?.[0]?.refs[0]?.plugin).toEqual(KNIP_PLUGIN_SLUG);
      expect(config.categories?.[0]?.refs[0]?.weight).toEqual(1);
    },
  );
});
