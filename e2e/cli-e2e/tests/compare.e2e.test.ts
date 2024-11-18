import { cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeAll } from 'vitest';
import type { ReportsDiff } from '@code-pushup/models';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';

describe('CLI compare', () => {
  const fixtureDummyDir = join(
    'e2e',
    'cli-e2e',
    'mocks',
    'fixtures',
    'dummy-setup',
  );

  const envRoot = join('tmp', 'e2e', 'cli-e2e');
  const testFileDir = join(envRoot, 'compare');
  const dummyDir = join(testFileDir, 'dummy-setup');
  const dummyOutputDir = join(dummyDir, '.code-pushup');

  beforeAll(async () => {
    await cp(fixtureDummyDir, dummyDir, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(dummyDir);
  });

  beforeEach(async () => {
    // create report before
    await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--persist.filename=source-report'],
      cwd: dummyDir,
    });

    // adding items to create a report diff
    const itemsFile = join(dummyDir, 'src', 'items.json');
    const items = JSON.parse((await readFile(itemsFile)).toString());
    await writeFile(itemsFile, JSON.stringify([...items, 4, 5, 6, 7], null, 2));

    await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--persist.filename=target-report'],
      cwd: dummyDir,
    });
  }, 20_000);

  // create report after
  afterEach(async () => {
    await teardownTestFolder(dummyOutputDir);
  });

  it('should compare report.json files and create report-diff.json and report-diff.md', async () => {
    await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'compare',
        `--before=${join('.code-pushup', 'source-report.json')}`,
        `--after=${join('.code-pushup', 'target-report.json')}`,
      ],
      cwd: dummyDir,
    });

    const reportsDiff = await readJsonFile<ReportsDiff>(
      join(dummyOutputDir, 'report-diff.json'),
    );
    expect(reportsDiff).toMatchSnapshot({
      commits: expect.any(Object),
      date: expect.any(String),
      duration: expect.any(Number),
      version: expect.any(String),
    });

    const reportsDiffMd = await readTextFile(
      join(dummyOutputDir, 'report-diff.md'),
    );
    // commits are variable, replace SHAs with placeholders
    const sanitizedMd = reportsDiffMd.replace(/[\da-f]{40}/g, '`<commit-sha>`');
    await expect(sanitizedMd).toMatchFileSnapshot(
      '__snapshots__/compare.report-diff.md',
    );
  });
});
