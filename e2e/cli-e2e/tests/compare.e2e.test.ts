import path from 'node:path';
import { beforeAll } from 'vitest';
import type { ReportsDiff } from '@code-pushup/models';
import {
  type TestEnvironment,
  setupTestEnvironment,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';

describe('CLI compare', () => {
  let testEnv: TestEnvironment;
  let existingDir: string;
  let existingOutputDir: string;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment(
      ['..', 'mocks', 'fixtures', 'existing-reports'],
      {
        callerUrl: import.meta.url,
      },
    );
    existingDir = testEnv.baseDir;
    existingOutputDir = path.join(existingDir, '.code-pushup');
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should compare report.json files and create report-diff.json and report-diff.md', async () => {
    await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'compare'],
      cwd: existingDir,
    });

    const reportsDiff = await readJsonFile<ReportsDiff>(
      path.join(existingOutputDir, 'report-diff.json'),
    );
    expect(reportsDiff).toMatchSnapshot({
      commits: expect.any(Object),
      date: expect.any(String),
      duration: expect.any(Number),
      version: expect.any(String),
    });

    const reportsDiffMd = await readTextFile(
      path.join(existingOutputDir, 'report-diff.md'),
    );
    // commits are variable, replace SHAs with placeholders
    const sanitizedMd = reportsDiffMd.replace(/[\da-f]{40}/g, '`<commit-sha>`');
    await expect(sanitizedMd).toMatchFileSnapshot(
      '__snapshots__/compare.report-diff.md',
    );
  });
});
