import { expect } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { lighthousePlugin } from './lighthouse-plugin';

describe('lighthousePlugin', () => {
  it('should execute valid plugin config', () => {
    const pluginConfig = lighthousePlugin('https://www.google.com/');
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.audits.length).toBeGreaterThan(100);
    expect(pluginConfig.groups).toHaveLength(5);
  });
});
