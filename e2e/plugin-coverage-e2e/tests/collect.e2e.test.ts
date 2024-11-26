import { cp } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  omitVariableReportData,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with coverage-plugin NPM package', () => {
  const envRoot = join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const testFileDir = join(envRoot, TEST_OUTPUT_DIR, 'collect');

  const basicDir = join(testFileDir, 'basic-setup');
  const existingDir = join(testFileDir, 'existing-report');

  const fixtureDir = join('e2e', nxTargetProject(), 'mocks', 'fixtures');
  beforeAll(async () => {
    await cp(fixtureDir, testFileDir, { recursive: true });
  });
  afterAll(async () => {
    await teardownTestFolder(basicDir);
    await teardownTestFolder(existingDir);
  });
  afterEach(async () => {
    await teardownTestFolder(join(basicDir, '.code-pushup'));
    await teardownTestFolder(join(existingDir, '.code-pushup'));
  });

  it('should run Code coverage plugin which collects passed results and creates report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: basicDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile(
      join(basicDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

  it('should run Code coverage plugin that runs coverage tool and creates report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: existingDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile(
      join(existingDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
