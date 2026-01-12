import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { omitVariableReportData } from '@code-pushup/test-fixtures';
import {
  type TestEnvironment,
  setupTestEnvironment,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with eslint-plugin NPM package', () => {
  let flatConfigEnv: TestEnvironment;
  let legacyConfigEnv: TestEnvironment;
  let artifactsConfigEnv: TestEnvironment;

  beforeEach(async () => {
    // Setup test environments using the unified function
    flatConfigEnv = await setupTestEnvironment(
      ['..', 'mocks', 'fixtures', 'flat-config'],
      {
        callerUrl: import.meta.url,
      },
    );
    legacyConfigEnv = await setupTestEnvironment(
      ['..', 'mocks', 'fixtures', 'legacy-config'],
      {
        callerUrl: import.meta.url,
      },
    );
    artifactsConfigEnv = await setupTestEnvironment(
      ['..', 'mocks', 'fixtures', 'artifacts-config'],
      {
        callerUrl: import.meta.url,
      },
    );
  });

  afterEach(async () => {
    // Cleanup all test environments
    await flatConfigEnv.cleanup();
    await legacyConfigEnv.cleanup();
    await artifactsConfigEnv.cleanup();
  });

  it('should run ESLint plugin for flat config and create report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect'],
      cwd: flatConfigEnv.baseDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile(
      path.join(flatConfigEnv.baseDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

  it('should run ESLint plugin for legacy config and create report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect'],
      cwd: legacyConfigEnv.baseDir,
      env: { ...process.env, ESLINT_USE_FLAT_CONFIG: 'false' },
    });

    expect(code).toBe(0);

    const report = await readJsonFile(
      path.join(legacyConfigEnv.baseDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

  it('should run ESLint plugin with artifacts options and create eslint-report.json and report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect'],
      cwd: artifactsConfigEnv.baseDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile(
      path.join(artifactsConfigEnv.baseDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
