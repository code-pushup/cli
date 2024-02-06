import { expect } from 'vitest';
import {
  auditSchema,
  groupSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import { AUDITS, GROUPS } from './constants';
import { lighthousePlugin } from './lighthouse-plugin';

describe('lighthousePlugin-config-object', () => {
  it('should create valid plugin config', () => {
    const pluginConfig = lighthousePlugin({
      url: 'https://code-pushup-portal.com',
    });
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.audits.length).toBeGreaterThan(0);
    expect(pluginConfig.groups?.length).toBeGreaterThan(0);
  });

  it('should filter audits by onlyAudits string "first-contentful-paint"', () => {
    const pluginConfig = lighthousePlugin({
      url: 'https://code-pushup-portal.com',
      onlyAudits: 'first-contentful-paint',
    });

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    expect(pluginConfig.audits[0]).toEqual(
      expect.objectContaining({
        slug: 'first-contentful-paint',
      }),
    );
  });

  it('should filter groups by onlyAudits string "first-contentful-paint"', () => {
    const pluginConfig = lighthousePlugin({
      url: 'https://code-pushup-portal.com',
      onlyAudits: 'first-contentful-paint',
    });

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.groups).toHaveLength(1);

    const refs = pluginConfig.groups?.[0]?.refs;
    expect(refs).toHaveLength(1);

    expect(refs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'first-contentful-paint',
        }),
      ]),
    );
  });
});

describe('constants', () => {
  it.each(AUDITS.map(a => [a.slug, a]))(
    'should parse audit "%s" correctly',
    (slug, audit) => {
      expect(() => auditSchema.parse(audit)).not.toThrow();
      expect(audit.slug).toEqual(slug);
    },
  );

  it.each(GROUPS.map(g => [g.slug, g]))(
    'should parse group "%s" correctly',
    (slug, group) => {
      expect(() => groupSchema.parse(group)).not.toThrow();
      expect(group.slug).toEqual(slug);
    },
  );
});
