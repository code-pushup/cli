import { expect } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { typescriptPlugin } from './typescript-plugin.js';

describe('typescriptPlugin-config-object', () => {
  it('should create valid plugin config', () => {
    const pluginConfig = typescriptPlugin('https://code-pushup-portal.com');
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
});
