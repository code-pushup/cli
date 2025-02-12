import { expect } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { lighthousePlugin } from './lighthouse-plugin.js';
import type { LighthouseOptions } from './types.js';

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

  it.each([
    [
      { onlyAudits: ['first-contentful-paint'] },
      'first-contentful-paint',
      false,
    ],
    [
      { onlyAudits: ['first-contentful-paint'] },
      'largest-contentful-paint',
      true,
    ],
    [
      { skipAudits: ['first-contentful-paint'] },
      'first-contentful-paint',
      true,
    ],
    [
      { skipAudits: ['first-contentful-paint'] },
      'largest-contentful-paint',
      false,
    ],
  ])(
    'should apply option %o and set the "%s" audit skipped status to %s',
    (option, audit, isSkipped) => {
      const pluginConfig = lighthousePlugin(
        'https://code-pushup-portal.com',
        option as LighthouseOptions,
      );
      expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
      expect(pluginConfig.audits.find(({ slug }) => audit === slug)).toEqual(
        expect.objectContaining({ isSkipped }),
      );
    },
  );

  it.each([
    [{ onlyGroups: ['performance'] }, 'performance', false],
    [{ onlyGroups: ['performance'] }, 'accessibility', true],
  ])(
    'should apply option %o and set the "%s" group skipped status to %s',
    (option, group, isSkipped) => {
      const pluginConfig = lighthousePlugin(
        'https://code-pushup-portal.com',
        option as LighthouseOptions,
      );
      expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
      expect(pluginConfig.groups?.find(({ slug }) => group === slug)).toEqual(
        expect.objectContaining({ isSkipped }),
      );
    },
  );

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
