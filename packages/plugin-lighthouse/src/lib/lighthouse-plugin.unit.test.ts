import { expect } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { lighthousePlugin } from './lighthouse-plugin.js';

describe('lighthousePlugin-config-object', () => {
  it('should create valid plugin config', () => {
    const pluginConfig = lighthousePlugin('https://code-pushup-portal.com');
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits.length).toBeGreaterThan(100);
    expect(groups).toStrictEqual([
      expect.objectContaining({ slug: 'performance' }),
      expect.objectContaining({ slug: 'accessibility' }),
      expect.objectContaining({ slug: 'best-practices' }),
      expect.objectContaining({ slug: 'seo' }),
    ]);
  });

  it('should mark audits in onlyAudits as not skipped', () => {
    const pluginConfig = lighthousePlugin('https://code-pushup-portal.com', {
      onlyAudits: ['first-contentful-paint'],
    });

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(
      pluginConfig.audits.find(({ slug }) => slug === 'first-contentful-paint'),
    ).toEqual(
      expect.objectContaining({
        isSkipped: false,
      }),
    );
  });

  it('should mark groups referencing audits in onlyAudits as not skipped', () => {
    const pluginConfig = lighthousePlugin('https://code-pushup-portal.com', {
      onlyAudits: ['first-contentful-paint'],
    });

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const group = pluginConfig.groups?.find(({ refs }) =>
      refs.some(ref => ref.slug === 'first-contentful-paint'),
    );

    expect(group).toEqual(
      expect.objectContaining({
        isSkipped: false,
      }),
    );
  });
});
