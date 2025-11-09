import { cp } from 'node:fs/promises';
import path from 'node:path';
import { simpleGit } from 'simple-git';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  NX_IGNORED_FILES_TO_RESTORE,
  TEST_OUTPUT_DIR,
  initGitRepo,
  omitVariableReportData,
  restoreRenamedFiles,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with coverage-plugin NPM package', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const testFileDir = path.join(envRoot, TEST_OUTPUT_DIR, 'collect');

  const basicDir = path.join(testFileDir, 'basic-setup');
  const existingDir = path.join(testFileDir, 'existing-report');

  const fixtureDir = path.join('e2e', nxTargetProject(), 'mocks', 'fixtures');

  beforeAll(async () => {
    await cp(fixtureDir, testFileDir, { recursive: true });
    await restoreRenamedFiles(testFileDir, NX_IGNORED_FILES_TO_RESTORE);
    await initGitRepo(simpleGit, { baseDir: basicDir });
    await initGitRepo(simpleGit, { baseDir: existingDir });
  });

  afterAll(async () => {
    await teardownTestFolder(basicDir);
    await teardownTestFolder(existingDir);
  });

  afterEach(async () => {
    await teardownTestFolder(path.join(basicDir, '.code-pushup'));
    await teardownTestFolder(path.join(existingDir, '.code-pushup'));
  });

  it('should run Code coverage plugin which runs tests and creates report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['code-pushup', 'collect', '--no-progress'],
      cwd: basicDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile<Report>(
      path.join(basicDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report)).toMatchSnapshot();
  });

  it('should run Code coverage plugin which parses existing lcov report and creates report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: existingDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile<Report>(
      path.join(existingDir, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report)).toMatchSnapshot();
  });
});
