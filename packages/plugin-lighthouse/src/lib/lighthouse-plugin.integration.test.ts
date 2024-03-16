import { expect } from 'vitest';
import { AuditOutput, pluginConfigSchema } from '@code-pushup/models';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
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
      onlyAudits: ['largest-contentful-paint'],
      outputPath: 'tmp/plugin-lighthouse/get-runner/should-run/lh-report.json',
    });
    await expect(runner()).resolves.toEqual([
      expect.objectContaining({
        slug: 'largest-contentful-paint',
        score: expect.any(Number),
        value: expect.any(Number),
        displayValue: expect.stringMatching('s$'),
      } satisfies AuditOutput),
    ]);
  });

  it('should log about unsupported precomputedLanternDataPath flag', async () => {
    const runner = getRunner('https://example.com', {
      precomputedLanternDataPath: '/path/to/latern-data',
      outputPath: 'tmp/plugin-lighthouse/get-runner/should-run/lh-report.json',
    });
    await expect(runner()).resolves.toBeTruthy();
    expect(getLogMessages(ui().logger).at(0)).toMatch(
      'The parsing precomputedLanternDataPath "/path/to/latern-data" is skipped as not implemented.',
    );
  });
}, 70_000);
