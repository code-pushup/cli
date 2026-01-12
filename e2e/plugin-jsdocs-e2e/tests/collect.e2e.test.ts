import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { omitVariableReportData } from '@code-pushup/test-fixtures';
import {
  type TestEnvironmentWithGit,
  setupTestEnvironment,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with jsdocs-plugin NPM package', () => {
  let angularTestEnv: TestEnvironmentWithGit;
  let reactTestEnv: TestEnvironmentWithGit;
  let angularDir: string;
  let angularOutputDir: string;

  beforeAll(async () => {
    angularTestEnv = await setupTestEnvironment(
      ['..', 'mocks', 'fixtures', 'angular'],
      {
        callerUrl: import.meta.url,
        git: true,
      },
    );
    reactTestEnv = await setupTestEnvironment(
      ['..', 'mocks', 'fixtures', 'react'],
      {
        callerUrl: import.meta.url,
        git: true,
      },
    );
    angularDir = angularTestEnv.baseDir;
    angularOutputDir = path.join(angularDir, '.code-pushup');
  });

  afterAll(async () => {
    await angularTestEnv.cleanup();
    await reactTestEnv.cleanup();
  });

  afterEach(async () => {
    // Output directories are cleaned up by the test environment cleanup
  });

  it('should run JSDoc plugin for Angular example dir and create report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect'],
      cwd: angularDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile<Report>(
      path.join(angularOutputDir, 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report)).toMatchSnapshot();
  });
});
