import { describe, expect, it } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { create } from './benchmark-js.plugin';

describe('lighthouse-create-export-config', () => {
  it('should return valid PluginConfig if create is called', () => {
    const pluginConfig = create({ suits: ['test-case-1'], targetFolder: '.' });
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual({
      slug: 'benchmark-js',
      title: 'Benchmark JS',
      description: 'Chrome lighthouse CLI as code-pushup plugin',
      icon: 'flash',
      runner: expect.any(Object),
      audits: [],
      groups: expect.any(Array),
    });
  });

  it('should parse options for defaults correctly in runner args', () => {
    const pluginConfig = create({
      suits: ['https://code-pushup.com'],
      targetFolder: '.',
    });
    expect(pluginConfig.runner).toEqual([
      'lighthouse',
      'https://code-pushup.com',
      '--no-verbose',
      '--output="json"',
      '--output-path="lighthouse-report.json"',
      '--onlyAudits="first-contentful-paint"',
      '--onlyAudits="largest-contentful-paint"',
      '--onlyAudits="speed-index"',
      '--onlyAudits="total-blocking-time"',
      '--onlyAudits="cumulative-layout-shift"',
      '--onlyAudits="server-response-time"',
      '--onlyAudits="interactive"',
      '--chrome-flags="--headless=new"',
    ]);
  });
});
