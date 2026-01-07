import { cp } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { omitVariableReportData } from '@code-pushup/test-fixtures';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with axe-plugin NPM package', () => {
  const fixturesDir = path.join('e2e', nxTargetProject(), 'mocks', 'fixtures');
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'collect',
  );

  beforeAll(async () => {
    await cp(fixturesDir, testFileDir, { recursive: true });
    await restoreNxIgnoredFiles(testFileDir);
  });

  afterAll(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should run plugin over CLI and create report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect'],
      cwd: testFileDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile<Report>(
      path.join(testFileDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report)).toMatchSnapshot();
  });
});
