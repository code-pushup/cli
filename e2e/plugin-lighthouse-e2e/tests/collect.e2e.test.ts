import { cp } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, expect } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  NX_IGNORED_FILES_TO_RESTORE,
  TEST_OUTPUT_DIR,
  omitVariableReportData,
  removeColorCodes,
  restoreRenamedFiles,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with lighthouse-plugin NPM package', () => {
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'collect',
  );
  const defaultSetupDir = path.join(testFileDir, 'default-setup');

  const fixturesDir = path.join('e2e', nxTargetProject(), 'mocks/fixtures');

  beforeAll(async () => {
    await cp(fixturesDir, testFileDir, { recursive: true });
    await restoreRenamedFiles(testFileDir, NX_IGNORED_FILES_TO_RESTORE);
  });

  afterAll(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should run plugin over CLI and creates report.json', async () => {
    const { code, stdout } = await executeProcess({
      command: 'npx',
      // verbose exposes audits with perfect scores that are hidden in the default stdout
      args: ['@code-pushup/cli', 'collect', '--no-progress', '--verbose'],
      cwd: defaultSetupDir,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('● Largest Contentful Paint');

    const report = await readJsonFile(
      path.join(defaultSetupDir, '.code-pushup', 'report.json'),
    );
    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(
      omitVariableReportData(report as Report, { omitAuditData: true }),
    ).toMatchSnapshot();
  });
});
