import { vol } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import {
  auditSchema,
  categoryRefSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import { LIGHTHOUSE_URL } from '../mock/constants';
import { lhr } from '../mock/fixtures/lhr';
import { LIGHTHOUSE_OUTPUT_FILE_DEFAULT, corePerfGroupRefs } from './constants';
import { audits, PLUGIN_SLUG as slug } from './index';
import { create } from './lighthouse.plugin';

describe('lighthouse-create-export', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        [LIGHTHOUSE_OUTPUT_FILE_DEFAULT]: JSON.stringify(lhr),
      },
      MEMFS_VOLUME,
    );
  });

  it('should return valid PluginConfig if create is called', () => {
    const pluginConfig = create({ url: LIGHTHOUSE_URL });
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

  it('should parse options for defaults correctly', () => {
    const pluginConfig = create({
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
      '--chromeFlags="--headless=new"',
    ]);
  });

  it('should parse options for headless by default to new', () => {
    const pluginConfig = create({
      url: LIGHTHOUSE_URL,
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining(['--chromeFlags="--headless=new"']),
    );
  });

  it('should parse options for headless to new if true is given', () => {
    const pluginConfig = create({
      url: LIGHTHOUSE_URL,
      headless: true,
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining(['--chromeFlags="--headless=new"']),
    );
  });

  it('should parse options for headless to new if false is given', () => {
    const pluginConfig = create({
      url: LIGHTHOUSE_URL,
      headless: false,
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.not.arrayContaining(['--chromeFlags="--headless=new"']),
    );
  });

  it('should parse options for userDataDir correctly', () => {
    const pluginConfig = create({
      url: LIGHTHOUSE_URL,
      userDataDir: 'test',
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining([
        '--chromeFlags="--headless=new --user-data-dir=test"',
      ]),
    );
  });

  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = create({ url: LIGHTHOUSE_URL });
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
    const pluginConfig = create({
      url: LIGHTHOUSE_URL,
      onlyAudits: 'largest-contentful-paint',
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining(['--onlyAudits="largest-contentful-paint"']),
    );
    const { audits: auditOutputs } = await executePlugin(pluginConfig);

    expect(auditOutputs).toHaveLength(1);
  });
}, 30_000);

describe('lighthouse-audits-export', () => {
  it.each(audits)('should be a valid audit meta info', audit => {
    expect(() => auditSchema.parse(audit)).not.toThrow();
  });
});

describe('lighthouse-corePerfGroupRefs-export', () => {
  it.each(corePerfGroupRefs)(
    'should be a valid category reference',
    categoryRef => {
      expect(() => categoryRefSchema.parse(categoryRef)).not.toThrow();
    },
  );
});
