import { cp } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  omitVariableReportData,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with eslint-plugin NPM package', () => {
  const fixturesDir = path.join(
    'e2e',
    'plugin-stylelint-e2e',
    'mocks',
    'fixtures',
  );
  const fixturesDefaultSetupDir = path.join(fixturesDir, 'default-setup');

  const envRoot = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
  );
  const testFileDir = path.join(envRoot, 'default-setup');
  const flatConfigOutputDir = path.join(testFileDir, '.code-pushup');

  beforeAll(async () => {
    await cp(fixturesDefaultSetupDir, testFileDir, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(testFileDir);
  });

  afterEach(async () => {
    await teardownTestFolder(flatConfigOutputDir);
  });

  it('should run StyleLint plugin for flat config and create report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: testFileDir,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(
      path.join(flatConfigOutputDir, 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

});
