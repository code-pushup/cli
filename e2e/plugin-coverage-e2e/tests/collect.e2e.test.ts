import path from 'node:path';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { omitVariableReportData } from '@code-pushup/test-fixtures';
import {
  type TestEnvironmentWithGit,
  setupTestEnvironment,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with coverage-plugin NPM package', () => {
  let basicEnv: TestEnvironmentWithGit;
  let existingEnv: TestEnvironmentWithGit;

  beforeAll(async () => {
    basicEnv = await setupTestEnvironment(
      ['..', 'mocks', 'fixtures', 'basic-setup'],
      {
        callerUrl: import.meta.url,
        git: true,
        testId: 'plugin-coverage-basic',
      },
    );
    existingEnv = await setupTestEnvironment(
      ['..', 'mocks', 'fixtures', 'existing-report'],
      {
        callerUrl: import.meta.url,
        git: true,
        testId: 'plugin-coverage-existing',
      },
    );
  });

  afterAll(async () => {
    await basicEnv.cleanup();
    await existingEnv.cleanup();
  });

  afterEach(async () => {
    await teardownTestFolder(path.join(basicEnv.baseDir, '.code-pushup'));
    await teardownTestFolder(path.join(existingEnv.baseDir, '.code-pushup'));
  });

  it('should run Code coverage plugin which runs tests and creates report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['code-pushup', 'collect'],
      cwd: basicEnv.baseDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile<Report>(
      path.join(basicEnv.baseDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report)).toMatchSnapshot();
  });

  it('should run Code coverage plugin which parses existing lcov report and creates report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect'],
      cwd: existingEnv.baseDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile<Report>(
      path.join(existingEnv.baseDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report)).toMatchSnapshot();
  });
});
