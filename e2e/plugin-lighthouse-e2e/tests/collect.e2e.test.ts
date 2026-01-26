import { cp } from 'node:fs/promises';
import path from 'node:path';
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
    await restoreNxIgnoredFiles(testFileDir);
  });

  afterAll(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should run plugin over CLI and creates report.json', async () => {
    const { code, stdout } = await executeProcess({
      command: 'npx',
      // verbose exposes audits with perfect scores that are hidden in the default stdout
      args: ['@code-pushup/cli', 'collect', '--verbose'],
      cwd: defaultSetupDir,
    });

    expect(code).toBe(0);
    expect(stdout).toContain('Largest Contentful Paint');

    const report = await readJsonFile(
      path.join(defaultSetupDir, '.code-pushup', 'report.json'),
    );
    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(
      omitVariableReportData(report as Report, { omitAuditData: true }),
    ).toMatchSnapshot();
  });
});
