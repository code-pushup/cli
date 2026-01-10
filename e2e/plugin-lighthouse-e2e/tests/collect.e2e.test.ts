import path from 'node:path';
import { afterAll, beforeAll, expect } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { omitVariableReportData } from '@code-pushup/test-fixtures';
import {
  type TestEnvironment,
  setupTestEnvironment,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with lighthouse-plugin NPM package', () => {
  let testEnv: TestEnvironment;
  let defaultSetupDir: string;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment(['..', 'mocks', 'fixtures'], {
      callerUrl: import.meta.url,
    });
    defaultSetupDir = path.join(testEnv.baseDir, 'default-setup');
  });

  afterAll(async () => {
    await testEnv.cleanup();
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
