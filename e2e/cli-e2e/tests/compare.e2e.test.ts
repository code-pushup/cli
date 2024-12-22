import { cp } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll } from 'vitest';
import type { ReportsDiff } from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { E2E_ENVIRONMENTS_DIR, TEST_OUTPUT_DIR } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';

describe('CLI compare', () => {
  const fixtureDummyDir = path.join(
    'e2e',
    nxTargetProject(),
    'mocks',
    'fixtures',
    'existing-reports',
  );

  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'compare',
  );
  const existingDir = path.join(testFileDir, 'existing-reports');
  const existingOutputDir = path.join(existingDir, '.code-pushup');

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
        `--before=${path.join('.code-pushup', 'source-report.json')}`,
        `--after=${path.join('.code-pushup', 'target-report.json')}`,
      ],
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
