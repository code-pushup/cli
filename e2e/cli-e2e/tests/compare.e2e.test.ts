import { cp } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeAll } from 'vitest';
import type { ReportsDiff } from '@code-pushup/models';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';

describe('CLI compare', () => {
  const fixtureDummyDir = join(
    'e2e',
    'cli-e2e',
    'mocks',
    'fixtures',
    'existing-reports',
  );

  const envRoot = join('tmp', 'e2e', 'cli-e2e');
  const testFileDir = join(envRoot, '__test__', 'compare');
  const existingDir = join(testFileDir, 'existing-reports');
  const existingOutputDir = join(existingDir, '.code-pushup');

  beforeAll(async () => {
    await cp(fixtureDummyDir, existingDir, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(existingDir);
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
      cwd: existingDir,
    });

    const reportsDiff = await readJsonFile<ReportsDiff>(
      join(existingOutputDir, 'report-diff.json'),
    );
    expect(reportsDiff).toMatchSnapshot({
      commits: expect.any(Object),
      date: expect.any(String),
      duration: expect.any(Number),
      version: expect.any(String),
    });

    const reportsDiffMd = await readTextFile(
      join(existingOutputDir, 'report-diff.md'),
    );
    // commits are variable, replace SHAs with placeholders
    const sanitizedMd = reportsDiffMd.replace(/[\da-f]{40}/g, '`<commit-sha>`');
    await expect(sanitizedMd).toMatchFileSnapshot(
      '__snapshots__/compare.report-diff.md',
    );
  });
});
