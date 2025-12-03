import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { commitSchema } from '@code-pushup/models';
import { MINIMAL_CONFIG_MOCK, cleanTestFolder } from '@code-pushup/test-utils';
import {
  ensureDirectoryExists,
  fileExists,
  readJsonFile,
} from '@code-pushup/utils';
import { collect } from './collect.js';
import { getRunnerOutputsPath } from './runner.js';

describe('collect', () => {
  const outputDir = path.join('tmp', 'int', 'core', 'collect', '.code-pushup');

  const expectedCachedOutput = [
    {
      slug: 'node-version',
      score: 0.3,
      value: 16,
      displayValue: '16.0.0',
      details: {
        issues: [
          {
            severity: 'error',
            message: 'The required Node version to run Code PushUp CLI is 18.',
          },
        ],
      },
    },
  ];

  const expectedCachedTestData = [
    {
      slug: 'node-version',
      score: 0.8,
      value: 18,
      displayValue: '18.0.0',
      details: { issues: [] },
    },
  ];

  const expectedPluginOutput = {
    slug: 'node',
    title: 'Node',
    icon: 'javascript',
    date: expect.any(String),
    audits: expectedCachedOutput.map(audit => ({
      ...audit,
      title: 'Node version',
      description: 'Returns node version',
      docsUrl: 'https://nodejs.org/',
    })),
  };

  beforeEach(async () => {
    await cleanTestFolder(outputDir);
    await ensureDirectoryExists(outputDir);
  });

  it('should execute with valid options', async () => {
    const report = await collect({
      ...MINIMAL_CONFIG_MOCK,
      persist: { outputDir },
      cache: { read: false, write: false },
    });

    expect(report.plugins[0]).toStrictEqual({
      ...expectedPluginOutput,
      duration: expect.any(Number),
    });
    expect(report.plugins[0]?.duration).toBeGreaterThanOrEqual(0);

    expect(() => commitSchema.parse(report.commit)).not.toThrow();

    await expect(
      fileExists(getRunnerOutputsPath('node', outputDir)),
    ).resolves.toBeFalsy();
  });

  it('should write runner outputs with --cache.write option', async () => {
    const report = await collect({
      ...MINIMAL_CONFIG_MOCK,
      persist: { outputDir },
      cache: { read: false, write: true },
    });

    expect(report.plugins[0]).toStrictEqual({
      ...expectedPluginOutput,
      duration: expect.any(Number),
    });
    expect(report.plugins[0]?.duration).toBeGreaterThanOrEqual(0);

    await expect(
      readJsonFile(getRunnerOutputsPath('node', outputDir)),
    ).resolves.toStrictEqual(expectedCachedOutput);
  });

  it('should read runner outputs with --cache.read option and have plugin duraton 0', async () => {
    const cacheFilePath = getRunnerOutputsPath('node', outputDir);
    await ensureDirectoryExists(path.dirname(cacheFilePath));
    await writeFile(cacheFilePath, JSON.stringify(expectedCachedTestData));

    const report = await collect({
      ...MINIMAL_CONFIG_MOCK,
      persist: { outputDir },
      cache: { read: true, write: false },
    });

    expect(report.plugins[0]?.audits[0]).toStrictEqual(
      expect.objectContaining(expectedCachedTestData[0]),
    );

    expect(report.plugins[0]).toStrictEqual({
      ...expectedPluginOutput,
      duration: 0,
      audits: expect.any(Array),
    });

    await expect(readJsonFile(cacheFilePath)).resolves.toStrictEqual(
      expectedCachedTestData,
    );
  });

  it('should execute runner and write cache with --cache option', async () => {
    const report = await collect({
      ...MINIMAL_CONFIG_MOCK,
      persist: { outputDir },
      cache: { read: true, write: true },
    });

    expect(report.plugins[0]).toStrictEqual({
      ...expectedPluginOutput,
      duration: expect.any(Number),
    });
    expect(report.plugins[0]?.duration).toBeGreaterThanOrEqual(0);

    await expect(
      readJsonFile(getRunnerOutputsPath('node', outputDir)),
    ).resolves.toStrictEqual(expectedCachedOutput);
  });
});
