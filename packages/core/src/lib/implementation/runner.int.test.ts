import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cleanTestFolder } from '@code-pushup/test-utils';
import { ensureDirectoryExists } from '@code-pushup/utils';
import {
  getRunnerOutputsPath,
  readRunnerResults,
  writeRunnerResults,
} from './runner.js';

describe('readRunnerResults', () => {
  const outputDir = path.join(
    'tmp',
    'int',
    'core',
    'runner',
    'read-result',
    '.code-pushup',
  );
  const pluginSlug = 'plugin-with-cache';
  const cacheDir = path.join(outputDir, pluginSlug);

  beforeEach(async () => {
    await ensureDirectoryExists(cacheDir);
    await writeFile(
      getRunnerOutputsPath(pluginSlug, outputDir),
      JSON.stringify([
        {
          slug: 'node-version',
          score: 0.3,
          value: 16,
        },
      ]),
    );
  });

  afterEach(async () => {
    await cleanTestFolder(outputDir);
  });

  it('should read runner results from a file', async () => {
    const runnerResults = await readRunnerResults(pluginSlug, outputDir);
    expect(runnerResults).toEqual({
      duration: 0, // Duration is overridden to 0 when reading from cache
      date: expect.any(String), // Date is overridden to current time when reading from cache
      audits: [
        {
          slug: 'node-version',
          score: 0.3,
          value: 16,
        },
      ],
    });
  });

  it('should return null if file does not exist', async () => {
    const runnerResults = await readRunnerResults(
      'plugin-with-no-cache',
      outputDir,
    );
    expect(runnerResults).toBeNull();
  });
});

describe('writeRunnerResults', () => {
  const outputDir = path.join(
    'tmp',
    'int',
    'core',
    'runner',
    'write-result',
    '.code-pushup',
  );
  const pluginSlug = 'plugin-with-cache';
  const cacheDir = path.join(outputDir, pluginSlug);

  beforeEach(async () => {
    await ensureDirectoryExists(cacheDir);
    await writeFile(
      getRunnerOutputsPath(pluginSlug, outputDir),
      JSON.stringify([
        {
          slug: 'node-version',
          score: 0.3,
          value: 16,
        },
      ]),
    );
  });

  afterEach(async () => {
    await cleanTestFolder(outputDir);
  });

  it('should write runner results to a file', async () => {
    await expect(
      writeRunnerResults(pluginSlug, outputDir, {
        duration: 1000,
        date: '2021-01-01',
        audits: [
          {
            slug: 'node-version',
            score: 0.3,
            value: 16,
          },
        ],
      }),
    ).resolves.toBeUndefined();

    await expect(readRunnerResults(pluginSlug, outputDir)).resolves.toEqual({
      duration: 0, // Duration is overridden to 0 when reading from cache
      date: expect.any(String), // Date is overridden to current time when reading from cache
      audits: [
        {
          slug: 'node-version',
          score: 0.3,
          value: 16,
        },
      ],
    });
  });
});
