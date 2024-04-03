import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect } from 'vitest';
import { AuditOutput, pluginConfigSchema } from '@code-pushup/models';
import {
  getLogMessages,
  shouldSkipLongRunningTests,
} from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { createRunnerFunction, lighthousePlugin } from './lighthouse-plugin';

const lighthousePluginTestFolder = join('tmp', 'plugin-lighthouse');

describe('lighthousePlugin', () => {
  it('should create valid plugin config', () => {
    const pluginConfig = lighthousePlugin('https://www.google.com/');
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.audits.length).toBeGreaterThan(100);
    expect(pluginConfig.groups).toHaveLength(5);
  });
});

// eslint-disable-next-line vitest/no-disabled-tests
describe.skip('runner creation and execution', () => {
  const getRunnerTestFolder = join(lighthousePluginTestFolder, 'get-runner');

  afterEach(async () => {
    await rm(getRunnerTestFolder, { recursive: true, force: true });
  });

  afterAll(async () => {
    await rm(lighthousePluginTestFolder, { recursive: true, force: true });
  });

  it.skipIf(shouldSkipLongRunningTests())(
    'should create and execute runner correctly',
    async () => {
      const runner = createRunnerFunction('https://www.google.com/', {
        // onlyAudits is used to reduce test time
        onlyAudits: ['is-on-https'],
        outputPath:
          'tmp/plugin-lighthouse/get-runner/should-create/lh-report.json',
        chromeFlags: ['--headless=shell'],
      });
      await expect(runner(undefined)).resolves.toEqual([
        expect.objectContaining({
          slug: 'is-on-https',
          score: 1,
          value: 0,
        } satisfies AuditOutput),
      ]);
    },
  );

  it.skipIf(shouldSkipLongRunningTests())(
    'should log about unsupported precomputedLanternDataPath flag',
    async () => {
      const precomputedLanternDataPath = join(
        'path',
        'to',
        'latern-data-folder',
      );
      const runner = createRunnerFunction('https://www.google.com/', {
        precomputedLanternDataPath,
        // onlyAudits is used to reduce test time
        onlyAudits: ['is-on-https'],
        outputPath:
          'tmp/plugin-lighthouse/get-runner/no-latern-data/lh-report.json',
        chromeFlags: ['--headless=shell'],
      });
      await expect(runner(undefined)).resolves.toBeTruthy();
      expect(getLogMessages(ui().logger).at(0)).toMatch(
        `Parsing precomputedLanternDataPath "${precomputedLanternDataPath}" is skipped as not implemented.`,
      );
    },
  );
}, 45_000);
