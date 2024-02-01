import { expect } from 'vitest';
import {
  auditSchema,
  categoryConfigSchema,
  groupSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import { audits, categories, groups } from './constants.generated';
import { lighthousePlugin } from './lighthouse-plugin';

describe('lighthousePlugin', () => {
  it('should create valid plugin config', () => {
    expect(() =>
      pluginConfigSchema.parse(
        lighthousePlugin({ url: 'https://code-pushup-portal.com' }),
      ),
    ).not.toThrow();
  });
});

describe('generated-constants', () => {
  it.each(audits.map(a => [a.slug, a]))(
    'should parsed audit "%s" correctly',
    (_, audit) => {
      expect(() => auditSchema.parse(audit)).not.toThrow();
    },
  );
  it.each(groups.map(a => [a.slug, a]))(
    'should parsed group "%s" correctly',
    (_, group) => {
      expect(() => groupSchema.parse(group)).not.toThrow();
    },
  );
  it.each(categories.map(a => [a.slug, a]))(
    'should parsed category "%s" correctly',
    (_, category) => {
      expect(() => categoryConfigSchema.parse(category)).not.toThrow();
    },
  );
});
