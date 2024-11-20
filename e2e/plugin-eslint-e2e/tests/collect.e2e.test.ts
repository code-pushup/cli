import { cp } from 'node:fs/promises';
import { join } from 'node:path';
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
  const testFileDir = join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'collect',
  );
  const oldVersionDir = join(testFileDir, 'old-version');
  const oldVersionOutputDir = join(oldVersionDir, '.code-pushup');

  const fixturesOldVersionDir = join(
    'e2e',
    nxTargetProject(),
    'mocks',
    'fixtures',
    'old-version',
  );
  beforeAll(async () => {
    await cp(fixturesOldVersionDir, oldVersionDir, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(oldVersionDir);
  });

  afterEach(async () => {
    await teardownTestFolder(oldVersionOutputDir);
  });

  it('should run ESLint plugin and create report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: oldVersionDir,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(join(oldVersionOutputDir, 'report.json'));

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
