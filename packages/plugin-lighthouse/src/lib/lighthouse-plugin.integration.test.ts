import { expect } from 'vitest';
import { AuditOutput, pluginConfigSchema } from '@code-pushup/models';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { getRunner, lighthousePlugin } from './lighthouse-plugin';

describe('lighthousePlugin', () => {
  it('should create valid plugin config', () => {
    const pluginConfig = lighthousePlugin('https://www.google.com/');
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.audits.length).toBeGreaterThan(100);
    expect(pluginConfig.groups).toHaveLength(5);
  });
});

describe('getRunner', () => {
  it('should create and execute runner correctly', async () => {
    const runner = getRunner('https://www.google.com/', {
      // onlyAudits is used to reduce test time
      onlyAudits: ['is-on-https'],
      outputPath:
        'tmp/plugin-lighthouse/get-runner/should-create/lh-report.json',
      chromeFlags: ['--headless=shell'],
    });
    await expect(runner()).resolves.toEqual([
      expect.objectContaining({
        slug: 'is-on-https',
        score: 1,
        value: 0,
      } satisfies AuditOutput),
    ]);
  });

  it('should log about unsupported precomputedLanternDataPath flag', async () => {
    const runner = getRunner('https://www.google.com/', {
      precomputedLanternDataPath: '/path/to/latern-data',
      // onlyAudits is used to reduce test time
      onlyAudits: ['is-on-https'],
      outputPath:
        'tmp/plugin-lighthouse/get-runner/no-latern-data/lh-report.json',
      chromeFlags: ['--headless=shell'],
    });
    await expect(runner()).resolves.toBeTruthy();
    expect(getLogMessages(ui().logger).at(0)).toMatch(
      'The parsing precomputedLanternDataPath "/path/to/latern-data" is skipped as not implemented.',
    );
  });
}, 30_000);
