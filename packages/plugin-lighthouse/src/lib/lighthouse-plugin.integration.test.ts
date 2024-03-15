import { expect } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { getRunner, lighthousePlugin } from './lighthouse-plugin';

describe('lighthousePlugin', () => {
  it('should create valid plugin config', () => {
    const pluginConfig = lighthousePlugin('https://code-pushup-portal.com');
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.audits.length).toBeGreaterThan(100);
    expect(pluginConfig.groups).toHaveLength(5);
  });
});

describe('getRunner', () => {
  it('should create and execute runner correctly', async () => {
    // onlyAudits is used to reduce test time
    const runner = getRunner('https://example.com', {
      onlyAudits: ['is-on-https'],
    });
    await expect(runner()).resolves.toEqual([
      expect.objectContaining({ slug: 'is-on-https' }),
    ]);
  });
}, 70_000);
