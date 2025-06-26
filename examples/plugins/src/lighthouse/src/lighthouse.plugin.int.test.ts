import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  auditSchema,
  categoryRefSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import { corePerfGroupRefs } from './constants.js';
import { audits, PLUGIN_SLUG as slug } from './index.js';
import { create } from './lighthouse.plugin.js';

describe('lighthouse-create-export-config', () => {
  it('should return valid PluginConfig if create is called', async () => {
    const pluginConfig = await create({ url: 'http://localhost:8080' });
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual({
      slug,
      title: 'Lighthouse',
      description: 'Chrome lighthouse CLI as code-pushup plugin',
      icon: 'lighthouse',
      runner: expect.any(Object),
      audits,
      groups: expect.any(Array),
    });
  });

  it('should parse options for defaults correctly in runner args', async () => {
    const pluginConfig = await create({
      url: 'https://code-pushup.com',
    });
    expect(pluginConfig.runner.args).toEqual([
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

  it('should parse options for headless by default to "new" in runner args', async () => {
    const pluginConfig = await create({
      url: 'http://localhost:8080',
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should parse options for headless to new if true is given in runner args', async () => {
    const pluginConfig = await create({
      url: 'http://localhost:8080',
      headless: true,
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should parse options for headless to new if false is given in runner args', async () => {
    const pluginConfig = await create({
      url: 'http://localhost:8080',
      headless: false,
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.not.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should override userDataDir option when given in runner args', async () => {
    const pluginConfig = await create({
      url: 'http://localhost:8080',
      userDataDir: 'test',
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining([
        '--chrome-flags="--headless=new --user-data-dir=test"',
      ]),
    );
  });

  it('should use onlyAudits', async () => {
    const pluginConfig = await create({
      url: 'http://localhost:8080',
      outputPath: `${path.join('tmp', 'lighthouse-report.json')}`,
      onlyAudits: 'largest-contentful-paint',
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining(['--onlyAudits="largest-contentful-paint"']),
    );
    expect(pluginConfig).toStrictEqual(
      expect.objectContaining({
        audits: expect.arrayContaining([
          expect.objectContaining({ slug: 'largest-contentful-paint' }),
        ]),
      }),
    );
  });
});

describe('lighthouse-audits-export', () => {
  it.each(audits.map(a => [a.slug, a]))(
    'should have a valid audit meta info for %s',
    (_, audit) => {
      expect(() => auditSchema.parse(audit)).not.toThrow();
    },
  );
});

describe('lighthouse-corePerfGroupRefs-export', () => {
  it.each(corePerfGroupRefs.map(g => [g.slug, g]))(
    'should be a valid category reference for %s',
    (_, categoryRef) => {
      expect(() => categoryRefSchema.parse(categoryRef)).not.toThrow();
    },
  );
});
