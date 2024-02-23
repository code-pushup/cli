import { join } from 'node:path';
import { expect, it } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import { lighthousePlugin } from '@code-pushup/examples-plugins';

describe('example plugin lighthouse', () => {
  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = await lighthousePlugin({
      url: 'http://example.com',
      onlyAudits: ['first-contentful-paint'],
      outputPath: `${join('tmp', 'lighthouse-report.json')}`,
    });
    await expect(executePlugin(pluginConfig)).resolves.toMatchObject(
      expect.objectContaining({
        slug: 'lighthouse',
        title: 'Lighthouse',
        description: 'Chrome lighthouse CLI as code-pushup plugin',
        duration: expect.any(Number),
        date: expect.any(String),
        audits: expect.arrayContaining([
          expect.objectContaining({ slug: 'first-contentful-paint' }),
        ]),
        groups: expect.any(Array),
      }),
    );
  });
});
