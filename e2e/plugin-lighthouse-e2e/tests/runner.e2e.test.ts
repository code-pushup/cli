import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect } from 'vitest';
import { createRunnerFunction } from '@code-pushup/lighthouse-plugin';
import { AuditOutput } from '@code-pushup/models';
import {
  getLogMessages,
  shouldSkipLongRunningTests,
} from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';

describe('createRunnerFunction', () => {
  const lighthousePluginTestFolder = join(
    'tmp',
    'plugin-lighthouse-runner-execution',
  );
  const getRunnerTestFolder = join(lighthousePluginTestFolder, 'get-runner');

  afterEach(async () => {
    await rm(getRunnerTestFolder, { recursive: true, force: true });
  });

  afterAll(async () => {
    await rm(lighthousePluginTestFolder, { recursive: true, force: true });
  });

  it.skipIf(shouldSkipLongRunningTests())(
    'should execute runner correctly',
    async () => {
      const runner = createRunnerFunction('https://codepushup.dev/', {
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
      const runner = createRunnerFunction('https://codepushup.dev/', {
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
