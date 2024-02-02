import { expect } from 'vitest';
import {
  auditSchema,
  groupSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import { AUDITS, GROUPS } from './constants';
import { lighthousePlugin } from './lighthouse-plugin';

describe('lighthousePlugin', () => {
  it('should create valid plugin config', () => {
    const pluginConfig = lighthousePlugin({
      url: 'https://code-pushup-portal.com',
    });
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.audits).toHaveLength(168);
    expect(pluginConfig.groups).toHaveLength(5);
  });
});

describe('generated-constants', () => {
  it.each(AUDITS.map(a => [a.slug, a]))(
    'should parsed audit "%s" correctly',
    (_, audit) => {
      expect(() => auditSchema.parse(audit)).not.toThrow();
      expect(audit.description).toEqual(expect.any(String));
    },
  );

  it.each(GROUPS.map(a => [a.slug, a]))(
    'should parsed group "%s" correctly',
    (_, group) => {
      expect(() => groupSchema.parse(group)).not.toThrow();
    },
  );
});
