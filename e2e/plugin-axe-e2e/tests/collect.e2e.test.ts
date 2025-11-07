import { cp } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  omitVariableReportData,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

function sanitizeReportPaths(report: Report): Report {
  // Convert to JSON, replace paths, and parse back
  const reportJson = JSON.stringify(report);
  const sanitized = reportJson.replace(
    /file:\/{3}.+?\/index\.html/g,
    'file:///<TEST_DIR>/index.html',
  );
  return JSON.parse(sanitized) as Report;
}

describe('PLUGIN collect report with axe-plugin NPM package', () => {
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'collect',
  );
  const defaultSetupDir = path.join(testFileDir, 'default-setup');
  const fixturesDir = path.join('e2e', nxTargetProject(), 'mocks', 'fixtures');

  beforeAll(async () => {
    await cp(fixturesDir, testFileDir, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should run plugin over CLI and create report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: defaultSetupDir,
    });

    expect(code).toBe(0);

    const report: Report = await readJsonFile(
      path.join(defaultSetupDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(
      omitVariableReportData(sanitizeReportPaths(report)),
    ).toMatchSnapshot();
  });
});
