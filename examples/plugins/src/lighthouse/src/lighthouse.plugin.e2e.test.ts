import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import { LIGHTHOUSE_URL } from '../mock/constants';
import { PLUGIN_SLUG as slug } from './index';
import { create } from './lighthouse.plugin';

describe('lighthouse-create-export-execution', () => {
  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = await create({
      url: LIGHTHOUSE_URL,
      outputPath: `${join('tmp', 'lighthouse-report.json')}`,
    });
    await expect(executePlugin(pluginConfig)).resolves.toMatchObject(
      expect.objectContaining({
        slug,
        title: 'Lighthouse',
        description: 'Chrome lighthouse CLI as code-pushup plugin',
        duration: expect.any(Number),
        date: expect.any(String),
        audits: expect.any(Array),
        groups: expect.any(Array),
      }),
    );
  });

  it('should use onlyAudits', async () => {
    const pluginConfig = await create({
      url: LIGHTHOUSE_URL,
      outputPath: `${join('tmp', 'lighthouse-report.json')}`,
      onlyAudits: 'largest-contentful-paint',
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining(['--onlyAudits="largest-contentful-paint"']),
    );
    const { audits: auditOutputs } = await executePlugin(pluginConfig);

    expect(auditOutputs).toHaveLength(1);
    expect(auditOutputs[0]?.slug).toBe('largest-contentful-paint');
  });
});
